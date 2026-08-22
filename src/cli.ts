import {
    deleteRunWithRetry,
    listReposForOwner,
    listRuns,
    resolveAuthenticatedLogin,
    resolveRepo,
    runGh,
} from "./cli-gh.ts";
import { printHelp, renderHelpText } from "./cli-help.ts";
import {
    getCreatedAtEpoch,
    printDryRunWorkflowSummary,
    printSummaryDetails,
    printTextSummary,
    printVerboseRuns,
    sortRuns,
} from "./cli-output.ts";
import {
    createProgressBar,
    createStyler,
    shouldShowProgress,
    shouldUseColor,
    shouldUseUnicode,
} from "./cli-styling.ts";
import {
    type ColorMode,
    type ErrorCategory,
    type ParsedOptions,
    type RunSummary,
    type Styler,
    VALID_STATUSES,
    type WorkflowRun,
} from "./cli-types.ts";

const BOOLEAN_OPTIONS: ReadonlySet<string> = new Set([
    "all-repos",
    "all-statuses",
    "ci",
    "confirm",
    "dry-run",
    "fail-fast",
    "help",
    "json",
    "no-color",
    "no-progress",
    "no-unicode",
    "quiet",
    "summary",
    "verbose",
    "yes",
]);
const COLOR_MODES = [
    "always",
    "auto",
    "never",
] as const;
const ORDERS = [
    "newest",
    "none",
    "oldest",
] as const;
const REPEATABLE_OPTIONS: ReadonlySet<string> = new Set([
    "exclude-branch",
    "exclude-workflow",
    "repos",
    "status",
]);
const UNICODE_MODES = [
    "always",
    "auto",
    "never",
] as const;

interface DeletionOutcome {
    readonly attempted: number;
    readonly deleted: number;
    readonly failedIds: readonly number[];
}

interface ExecutionConfig {
    readonly beforeDays: number | undefined;
    readonly ciMode: boolean;
    readonly dryRun: boolean;
    readonly excludedBranchNames: ReadonlySet<string>;
    readonly excludedWorkflowNames: ReadonlySet<string>;
    readonly failFast: boolean;
    readonly jsonOutput: boolean;
    readonly limit: number;
    readonly maxDelete: number | undefined;
    readonly maxFailures: number | undefined;
    readonly maxRetries: number;
    readonly noProgress: boolean;
    readonly options: Readonly<ParsedOptions>;
    readonly order: Order;
    readonly quiet: boolean;
    readonly retryDelayMs: number;
    readonly statuses: readonly string[];
    readonly styler: Styler;
    readonly summaryMode: boolean;
    readonly targetRepos: readonly string[];
    readonly useUnicodeTables: boolean;
    readonly verbose: boolean;
}

interface ExitResult {
    readonly exitCode: number;
    readonly ok: false;
}

interface NumericConfig {
    readonly beforeDays: number | undefined;
    readonly limit: number;
    readonly maxDelete: number | undefined;
    readonly maxFailures: number | undefined;
    readonly maxRetries: number;
    readonly retryDelayMs: number;
}

type Order = (typeof ORDERS)[number];

interface ParsedArgument {
    readonly consumesNextToken: boolean;
    readonly key: string;
    readonly value: boolean | string;
}

type ProcessRepositoryParams = Omit<ExecutionConfig, "targetRepos"> & {
    readonly repoIndex: number;
    readonly repoTotal: number;
    readonly resolvedRepo: string;
};

interface RunSelection {
    readonly candidates: readonly WorkflowRun[];
    readonly deduplicatedCount: number;
    readonly matchedRuns: readonly WorkflowRun[];
    readonly skippedByAge: number;
    readonly skippedByExclusion: number;
}

type StepResult<T> = ExitResult | SuccessResult<T>;

interface SuccessResult<T> {
    readonly ok: true;
    readonly value: T;
}

/** Execute the workflow-run cleanup command and return a process exit code. */
export function main(argv: readonly string[]): number {
    const startedAt = Date.now();
    const options = parseArguments(argv);
    const built = buildExecutionConfig(options);
    if (!built.ok) {
        return built.exitCode;
    }

    const config = built.value;
    const {
        beforeDays,
        ciMode,
        dryRun,
        excludedBranchNames,
        excludedWorkflowNames,
        failFast,
        jsonOutput,
        limit,
        maxDelete,
        maxFailures,
        maxRetries,
        noProgress,
        options: normalizedOptions,
        order,
        quiet,
        retryDelayMs,
        statuses,
        styler,
        summaryMode,
        targetRepos,
        useUnicodeTables,
        verbose,
    } = config;

    const repoSummaries: RunSummary[] = [];

    for (const [repoIndex, resolvedRepo] of targetRepos.entries()) {
        const result = processRepository({
            beforeDays,
            ciMode,
            dryRun,
            excludedBranchNames,
            excludedWorkflowNames,
            failFast,
            jsonOutput,
            limit,
            maxDelete,
            maxFailures,
            maxRetries,
            noProgress,
            options: normalizedOptions,
            order,
            quiet,
            repoIndex,
            repoTotal: targetRepos.length,
            resolvedRepo,
            retryDelayMs,
            statuses,
            styler,
            summaryMode,
            useUnicodeTables,
            verbose,
        });

        if (!result.ok) {
            return result.exitCode;
        }

        repoSummaries.push(result.value);
    }

    if (jsonOutput) {
        printJsonSummaries(repoSummaries, dryRun, startedAt);
    }

    const hasFailures = repoSummaries.some((summary) => summary.failed > 0);
    return hasFailures ? 2 : 0;
}

/** Execute the CLI using the current process arguments. */
export function runCli(): void {
    process.exitCode = main(process.argv.slice(2));
}

function assignParsedArgument(
    parsed: Readonly<ParsedOptions>,
    argument: ParsedArgument
): ParsedOptions {
    if (
        typeof argument.value === "boolean" ||
        !REPEATABLE_OPTIONS.has(argument.key)
    ) {
        return { ...parsed, [argument.key]: argument.value };
    }

    const existing = parsed[argument.key];
    const bucket = isStringArray(existing) ? [...existing] : [];
    bucket.push(argument.value);
    return { ...parsed, [argument.key]: bucket };
}

function buildExecutionConfig(
    options: Readonly<ParsedOptions>
): StepResult<ExecutionConfig> {
    const isJsonOutput = options["json"] === true;
    const isCiMode = options["ci"] === true;
    const isNoProgress = options["no-progress"] === true;
    const colorOption = resolveDisplayMode(
        options,
        "color",
        isCiMode || options["no-color"] === true ? "never" : undefined
    );
    const colorMode: ColorMode = isAllowedValue(colorOption, COLOR_MODES)
        ? colorOption
        : "auto";
    const styler = createStyler(shouldUseColor(colorMode, isJsonOutput));

    if (options["help"] === true) {
        console.log(renderHelpText(styler));
        return { exitCode: 0, ok: false };
    }

    if (!isAllowedValue(colorOption, COLOR_MODES)) {
        return createErrorResult(
            "--color must be one of: auto, always, never.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const isDryRun = options["dry-run"] === true;
    const isConfirm = options["confirm"] === true || options["yes"] === true;
    const isVerbose = options["verbose"] === true;
    const isSummaryMode = options["summary"] === true;
    const isQuiet = options["quiet"] === true;
    const isFailFast = options["fail-fast"] === true;

    const unicodeOption = resolveDisplayMode(
        options,
        "unicode",
        isCiMode || options["no-unicode"] === true ? "never" : undefined
    );
    if (!isAllowedValue(unicodeOption, UNICODE_MODES)) {
        return createErrorResult(
            "--unicode must be one of: auto, always, never.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const useUnicodeTables = shouldUseUnicode(unicodeOption, isJsonOutput);

    if (!isDryRun && !isConfirm) {
        return createErrorResult(
            "Safety stop: pass --confirm to perform deletion, or use --dry-run to preview.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const excludedWorkflowNames = new Set(
        collectStringListOption(options, "exclude-workflow").map((value) =>
            value.toLowerCase()
        )
    );
    const excludedBranchNames = new Set(
        collectStringListOption(options, "exclude-branch").map((value) =>
            value.toLowerCase()
        )
    );

    const statusesResult = parseStatuses(options, isJsonOutput, styler);
    if (!statusesResult.ok) {
        return statusesResult;
    }

    const numericResult = parseNumericConfig(options, isJsonOutput, styler);
    if (!numericResult.ok) {
        return numericResult;
    }

    const orderOption = readNormalizedString(options["order"]) ?? "oldest";
    if (!isAllowedValue(orderOption, ORDERS)) {
        return createErrorResult(
            "--order must be one of: oldest, newest, none.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const targetReposResult = resolveTargetRepos(options, isJsonOutput, styler);
    if (!targetReposResult.ok) {
        return targetReposResult;
    }

    const numericConfig = numericResult.value;
    const normalizedOptions: ParsedOptions = {
        ...options,
        limit: String(numericConfig.limit),
    };

    return succeed({
        beforeDays: numericConfig.beforeDays,
        ciMode: isCiMode,
        dryRun: isDryRun,
        excludedBranchNames,
        excludedWorkflowNames,
        failFast: isFailFast,
        jsonOutput: isJsonOutput,
        limit: numericConfig.limit,
        maxDelete: numericConfig.maxDelete,
        maxFailures: numericConfig.maxFailures,
        maxRetries: numericConfig.maxRetries,
        noProgress: isNoProgress,
        options: normalizedOptions,
        order: orderOption,
        quiet: isQuiet,
        retryDelayMs: numericConfig.retryDelayMs,
        statuses: statusesResult.value,
        styler,
        summaryMode: isSummaryMode,
        targetRepos: targetReposResult.value,
        useUnicodeTables,
        verbose: isVerbose,
    });
}

function collectStringListOption(
    options: Readonly<ParsedOptions>,
    key: string
): string[] {
    const rawValues = options[key];
    if (isStringArray(rawValues)) {
        return rawValues
            .flatMap((value) => value.split(","))
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    }

    if (typeof rawValues === "string") {
        return rawValues
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    }

    return [];
}

function collectStringValues(
    rawValue: ParsedOptions[string] | undefined,
    defaultValue: string
): readonly string[] {
    if (isStringArray(rawValue)) {
        return rawValue;
    }

    return typeof rawValue === "string" ? [rawValue] : [defaultValue];
}

function createErrorResult(
    message: string,
    category: ErrorCategory,
    isJsonOutput: boolean,
    styler?: Styler
): ExitResult {
    return {
        exitCode: emitError(message, category, isJsonOutput, styler),
        ok: false,
    };
}

function deleteCandidates(
    candidates: readonly WorkflowRun[],
    params: ProcessRepositoryParams,
    showProgress: boolean
): DeletionOutcome {
    const failedIds: number[] = [];
    const state = { attempted: 0, deleted: 0 };
    if (params.dryRun) {
        return { ...state, failedIds };
    }

    const deletionProgress = createProgressBar(
        "Deleting runs",
        candidates.length,
        params.styler,
        showProgress
    );
    for (const run of candidates) {
        state.attempted += 1;
        const result = deleteRunWithRetry(
            params.resolvedRepo,
            run.databaseId,
            params.maxRetries,
            params.retryDelayMs,
            (attemptNumber, totalAttempts) => {
                deletionProgress.update(
                    state.attempted - 1,
                    `id=${run.databaseId} a=${attemptNumber}/${totalAttempts} d=${state.deleted} f=${failedIds.length}`
                );
            }
        );

        if (result.ok) {
            state.deleted += 1;
        } else {
            failedIds.push(run.databaseId);
            reportDeletionFailure(run.databaseId, result, params);
        }

        deletionProgress.update(
            state.attempted,
            `d=${state.deleted} f=${failedIds.length}`
        );
        const hasReachedFailureLimit =
            !result.ok &&
            (params.failFast ||
                (params.maxFailures !== undefined &&
                    failedIds.length >= params.maxFailures));
        if (hasReachedFailureLimit) {
            break;
        }
    }
    deletionProgress.done();

    return { ...state, failedIds };
}

function emitError(
    message: string,
    category: ErrorCategory,
    isJsonOutput: boolean,
    styler?: Styler
): number {
    if (isJsonOutput) {
        console.error(
            JSON.stringify(
                {
                    error: {
                        category,
                        message,
                    },
                },
                null,
                2
            )
        );
        return 1;
    }

    const rendered = styler
        ? styler.error(`Error: ${message}`)
        : `Error: ${message}`;
    console.error(rendered);
    return 1;
}

function fetchWorkflowRuns(
    params: ProcessRepositoryParams,
    showProgress: boolean
): StepResult<readonly WorkflowRun[]> {
    const allRuns: WorkflowRun[] = [];
    const fetchProgress = createProgressBar(
        "Fetching runs",
        Math.max(1, params.statuses.length * params.limit),
        params.styler,
        showProgress
    );

    try {
        for (const [index, status] of params.statuses.entries()) {
            const beforeCount = allRuns.length;
            const runs = listRuns(
                params.resolvedRepo,
                status,
                params.options,
                (fetchedInStatus, detail) => {
                    fetchProgress.update(
                        beforeCount + fetchedInStatus,
                        `s=${index + 1}/${params.statuses.length} ${status} ${detail} runs=${beforeCount + fetchedInStatus}`
                    );
                }
            );
            allRuns.push(...runs);
            fetchProgress.update(
                allRuns.length,
                `s=${index + 1}/${params.statuses.length} ${status} done runs=${allRuns.length}`
            );
        }
        fetchProgress.done();
        return succeed(allRuns);
    } catch (error) {
        fetchProgress.done();
        const message = error instanceof Error ? error.message : String(error);
        return createErrorResult(
            `failed to list runs for ${params.resolvedRepo}: ${message}`,
            "gh_cli_error",
            params.jsonOutput,
            params.styler
        );
    }
}

function invalidReposResult(
    invalidRepos: readonly string[],
    isJsonOutput: boolean,
    styler: Styler
): ExitResult {
    return createErrorResult(
        `invalid repository values: ${invalidRepos.join(", ")}. Use owner/name format.`,
        "validation_error",
        isJsonOutput,
        styler
    );
}

function isAllowedValue<T extends string>(
    value: string,
    allowedValues: readonly T[]
): value is T {
    for (const allowedValue of allowedValues) {
        if (allowedValue === value) {
            return true;
        }
    }

    return false;
}

function isStringArray(value: unknown): value is readonly string[] {
    return (
        Array.isArray(value) &&
        value.every((item: unknown) => typeof item === "string")
    );
}

function isValidRepoSlug(value: string): boolean {
    return /^[^\s\/]+\/[^\s\/]+$/v.test(value);
}

function parseArgument(
    token: string,
    nextToken: string | undefined
): ParsedArgument {
    const optionText = token.slice(2);
    const separatorIndex = optionText.indexOf("=");
    const hasInlineValue = separatorIndex !== -1;
    const key = (
        hasInlineValue ? optionText.slice(0, separatorIndex) : optionText
    ).trim();
    if (BOOLEAN_OPTIONS.has(key)) {
        return { consumesNextToken: false, key, value: true };
    }

    if (hasInlineValue) {
        return {
            consumesNextToken: false,
            key,
            value: optionText.slice(separatorIndex + 1),
        };
    }

    const hasSeparateValue =
        nextToken !== undefined && !nextToken.startsWith("--");
    return {
        consumesNextToken: hasSeparateValue,
        key,
        value: hasSeparateValue ? nextToken : "",
    };
}

function parseArguments(args: readonly string[]): ParsedOptions {
    let parsed: ParsedOptions = {};

    for (let index = 0; index < args.length; index += 1) {
        const token = args[index];
        if (token?.startsWith("--") === true) {
            const argument = parseArgument(token, args[index + 1]);
            parsed = assignParsedArgument(parsed, argument);
            index += argument.consumesNextToken ? 1 : 0;
        }
    }

    return parsed;
}

function parseIntegerValue(
    rawValue: ParsedOptions[string] | undefined,
    defaultValue: number | undefined,
    minimum: number
):
    | null
    | number
    | undefined {
    if (rawValue === undefined) {
        return defaultValue;
    }

    if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
        return null;
    }

    const value = Number(rawValue);
    return Number.isSafeInteger(value) && value >= minimum ? value : null;
}

function parseNumericConfig(
    options: Readonly<ParsedOptions>,
    isJsonOutput: boolean,
    styler: Styler
): StepResult<NumericConfig> {
    const limit = parseIntegerValue(options["limit"], 500, 1);
    if (typeof limit !== "number") {
        return createErrorResult(
            "--limit must be a positive integer.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const maxDelete = parseIntegerValue(options["max-delete"], undefined, 1);
    if (maxDelete === null) {
        return createErrorResult(
            "--max-delete must be a positive integer.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const beforeDays = parseIntegerValue(options["before-days"], undefined, 0);
    if (beforeDays === null) {
        return createErrorResult(
            "--before-days must be a non-negative integer.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const maxRetries = parseIntegerValue(options["max-retries"], 2, 0);
    if (typeof maxRetries !== "number") {
        return createErrorResult(
            "--max-retries must be a non-negative integer.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const retryDelayMs = parseIntegerValue(options["retry-delay-ms"], 200, 0);
    if (typeof retryDelayMs !== "number") {
        return createErrorResult(
            "--retry-delay-ms must be a non-negative integer.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const maxFailures = parseIntegerValue(
        options["max-failures"],
        undefined,
        1
    );
    if (maxFailures === null) {
        return createErrorResult(
            "--max-failures must be a positive integer.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    return succeed({
        beforeDays,
        limit,
        maxDelete,
        maxFailures,
        maxRetries,
        retryDelayMs,
    });
}

function parseStatuses(
    options: Readonly<ParsedOptions>,
    isJsonOutput: boolean,
    styler: Styler
): StepResult<readonly string[]> {
    const rawStatusValues =
        options["all-statuses"] === true
            ? [[...VALID_STATUSES].join(",")]
            : collectStringValues(options["status"], "failure,cancelled");
    const statuses = rawStatusValues
        .flatMap((part) => part.split(","))
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

    if (statuses.length === 0) {
        return createErrorResult(
            "at least one --status value is required.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const invalidStatuses = statuses.filter(
        (status) => !VALID_STATUSES.has(status)
    );
    if (invalidStatuses.length > 0) {
        return createErrorResult(
            `invalid statuses: ${invalidStatuses.join(", ")}. Valid values: ${[...VALID_STATUSES].join(", ")}`,
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    return succeed(statuses);
}

function printDeletionPlan(
    fetchedCount: number,
    selection: RunSelection,
    params: ProcessRepositoryParams
): void {
    if (params.verbose && !params.jsonOutput && !params.quiet) {
        printVerboseRuns(
            selection.candidates,
            params.styler,
            params.useUnicodeTables
        );
    }

    if (!params.jsonOutput && !params.quiet) {
        console.log(
            params.styler.info(
                `Planned deletions: ${selection.candidates.length} (from ${fetchedCount} fetched runs, ${selection.deduplicatedCount} unique).`
            )
        );
    }
}

function printJsonSummaries(
    repoSummaries: readonly RunSummary[],
    isDryRun: boolean,
    startedAt: number
): void {
    if (repoSummaries.length === 1) {
        console.log(JSON.stringify(repoSummaries[0], null, 2));
        return;
    }

    const aggregate = {
        attempted: repoSummaries.reduce(
            (accumulator, summary) => accumulator + summary.attempted,
            0
        ),
        deleted: repoSummaries.reduce(
            (accumulator, summary) => accumulator + summary.deleted,
            0
        ),
        dryRun: isDryRun,
        durationMs: Date.now() - startedAt,
        failed: repoSummaries.reduce(
            (accumulator, summary) => accumulator + summary.failed,
            0
        ),
        matched: repoSummaries.reduce(
            (accumulator, summary) => accumulator + summary.matched,
            0
        ),
        planned: repoSummaries.reduce(
            (accumulator, summary) => accumulator + summary.planned,
            0
        ),
        repoCount: repoSummaries.length,
    };

    console.log(
        JSON.stringify(
            {
                aggregate,
                repos: repoSummaries,
            },
            null,
            2
        )
    );
}

function printRepositoryHeading(params: ProcessRepositoryParams): void {
    if (params.jsonOutput || params.quiet || params.repoTotal <= 1) {
        return;
    }

    if (params.repoIndex > 0) {
        console.log("");
    }
    console.log(
        params.styler.heading(
            `Repository ${params.repoIndex + 1}/${params.repoTotal}: ${params.resolvedRepo}`
        )
    );
}

function printRepositorySummary(
    summary: RunSummary,
    selection: RunSelection,
    params: ProcessRepositoryParams
): void {
    if (params.jsonOutput || params.quiet) {
        return;
    }

    printTextSummary(summary, params.styler, params.useUnicodeTables);
    if (params.dryRun) {
        printDryRunWorkflowSummary(
            selection.candidates,
            params.styler,
            params.useUnicodeTables
        );
    }
    if (params.summaryMode) {
        printSummaryDetails(
            selection.matchedRuns,
            selection.candidates,
            params.styler,
            params.useUnicodeTables
        );
    }
    if (params.dryRun) {
        console.log(
            params.styler.ok("Dry run complete: no deletions performed.")
        );
    }
}

function processRepository(
    params: ProcessRepositoryParams
): StepResult<RunSummary> {
    printRepositoryHeading(params);
    const repoStartedAt = Date.now();
    const showProgress = shouldShowProgress(
        params.jsonOutput,
        params.quiet,
        params.verbose,
        params.noProgress,
        params.ciMode
    );
    const fetchedRunsResult = fetchWorkflowRuns(params, showProgress);
    if (!fetchedRunsResult.ok) {
        return fetchedRunsResult;
    }

    const allRuns = fetchedRunsResult.value;
    const selection = selectRuns(allRuns, params);
    printDeletionPlan(allRuns.length, selection, params);
    const deletion = deleteCandidates(
        selection.candidates,
        params,
        showProgress
    );
    const summary: RunSummary = {
        attempted: deletion.attempted,
        deleted: deletion.deleted,
        dryRun: params.dryRun,
        durationMs: Date.now() - repoStartedAt,
        failed: deletion.failedIds.length,
        failedIds: deletion.failedIds,
        matched: selection.matchedRuns.length,
        planned: selection.candidates.length,
        repo: params.resolvedRepo,
        skippedByAge: selection.skippedByAge,
        skippedByExclusion: selection.skippedByExclusion,
        statuses: params.statuses,
    };

    printRepositorySummary(summary, selection, params);
    return succeed(summary);
}

function readNormalizedString(
    value: ParsedOptions[string] | undefined
): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
}

function reportDeletionFailure(
    runId: number,
    result: Readonly<ReturnType<typeof deleteRunWithRetry>>,
    params: ProcessRepositoryParams
): void {
    if (params.verbose && !params.jsonOutput) {
        console.error(
            `Delete failed for run ${runId} after ${result.attempts} attempt(s): ${result.error ?? "unknown"}`
        );
    }
}

function resolveAllRepositories(
    options: Readonly<ParsedOptions>,
    isJsonOutput: boolean,
    styler: Styler
): StepResult<readonly string[]> {
    const ownerOption =
        typeof options["owner"] === "string" ? options["owner"].trim() : "";
    const owner =
        ownerOption.length > 0 ? ownerOption : resolveAuthenticatedLogin();
    if (typeof owner !== "string" || owner.length === 0) {
        return createErrorResult(
            "unable to resolve authenticated user for --all-repos. Pass --owner <login>.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    try {
        const targetRepos = listReposForOwner(owner);
        return targetRepos.length > 0
            ? succeed(targetRepos)
            : createErrorResult(
                  `no repositories found for ${owner}.`,
                  "validation_error",
                  isJsonOutput,
                  styler
              );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return createErrorResult(
            `failed to list repositories: ${message}`,
            "gh_cli_error",
            isJsonOutput,
            styler
        );
    }
}

function resolveDisplayMode(
    options: Readonly<ParsedOptions>,
    key: "color" | "unicode",
    forcedValue: string | undefined
): string {
    return forcedValue ?? readNormalizedString(options[key]) ?? "auto";
}

function resolveExplicitOrCurrentRepo(
    explicitRepos: readonly string[],
    isJsonOutput: boolean,
    styler: Styler
): StepResult<readonly string[]> {
    if (explicitRepos.length > 0) {
        return succeed(explicitRepos);
    }

    const resolved = resolveRepo(undefined);
    if (typeof resolved === "string" && resolved.length > 0) {
        return succeed([resolved]);
    }

    if (!isJsonOutput) {
        console.log(printHelp());
    }
    return createErrorResult(
        "unable to resolve repository. Provide --repo <owner/name> / --repos <owner/name,..> or run inside a GitHub repository.",
        "validation_error",
        isJsonOutput,
        styler
    );
}

function resolveTargetRepos(
    options: Readonly<ParsedOptions>,
    isJsonOutput: boolean,
    styler: Styler
): StepResult<readonly string[]> {
    const repoOption =
        typeof options["repo"] === "string" ? options["repo"].trim() : "";
    const explicitRepos = [
        ...(repoOption.length > 0 ? [repoOption] : []),
        ...collectStringListOption(options, "repos"),
    ];
    const isAllReposMode = options["all-repos"] === true;

    if (isAllReposMode && explicitRepos.length > 0) {
        return createErrorResult(
            "--all-repos cannot be combined with --repo or --repos.",
            "validation_error",
            isJsonOutput,
            styler
        );
    }

    const invalidExplicitRepos = explicitRepos.filter(
        (repo) => !isValidRepoSlug(repo)
    );
    if (invalidExplicitRepos.length > 0) {
        return invalidReposResult(invalidExplicitRepos, isJsonOutput, styler);
    }

    const authResult = runGh(["auth", "status"]);
    if (authResult.status !== 0) {
        return createErrorResult(
            "gh CLI is not authenticated. Run: gh auth login",
            "auth_error",
            isJsonOutput,
            styler
        );
    }

    const targetResult = isAllReposMode
        ? resolveAllRepositories(options, isJsonOutput, styler)
        : resolveExplicitOrCurrentRepo(explicitRepos, isJsonOutput, styler);
    if (!targetResult.ok) {
        return targetResult;
    }

    const targetRepos = [...new Set(targetResult.value)];
    const invalidTargetRepos = targetRepos.filter(
        (repo) => !isValidRepoSlug(repo)
    );
    return invalidTargetRepos.length > 0
        ? invalidReposResult(invalidTargetRepos, isJsonOutput, styler)
        : succeed(targetRepos);
}

function selectRuns(
    allRuns: readonly WorkflowRun[],
    params: ProcessRepositoryParams
): RunSelection {
    const seenRunIds = new Set<number>();
    const deduplicatedRuns = allRuns.filter((run) => {
        const isDuplicate = seenRunIds.has(run.databaseId);
        seenRunIds.add(run.databaseId);
        return !isDuplicate;
    });
    const orderedRuns = sortRuns(deduplicatedRuns, params.order);

    let skippedByExclusion = 0;
    const includedRuns = orderedRuns.filter((run) => {
        const workflowName = run.workflowName?.toLowerCase();
        const branchName = run.headBranch?.toLowerCase();
        const isExcluded =
            (workflowName !== undefined &&
                params.excludedWorkflowNames.has(workflowName)) ||
            (branchName !== undefined &&
                params.excludedBranchNames.has(branchName));
        skippedByExclusion += isExcluded ? 1 : 0;
        return !isExcluded;
    });

    let skippedByAge = 0;
    const ageCutoffEpoch =
        params.beforeDays === undefined
            ? undefined
            : Date.now() - params.beforeDays * 24 * 60 * 60 * 1000;
    const matchedRuns = includedRuns.filter((run) => {
        const createdEpoch = getCreatedAtEpoch(run);
        const isIncluded =
            ageCutoffEpoch === undefined ||
            (Number.isFinite(createdEpoch) && createdEpoch <= ageCutoffEpoch);
        skippedByAge += isIncluded ? 0 : 1;
        return isIncluded;
    });
    const candidates =
        params.maxDelete === undefined
            ? matchedRuns
            : matchedRuns.slice(0, params.maxDelete);

    return {
        candidates,
        deduplicatedCount: deduplicatedRuns.length,
        matchedRuns,
        skippedByAge,
        skippedByExclusion,
    };
}

function succeed<T>(value: T): SuccessResult<T> {
    return { ok: true, value };
}
