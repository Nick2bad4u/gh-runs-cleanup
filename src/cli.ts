#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

type WorkflowRun = {
    databaseId: number;
    status?: string;
    conclusion?: string;
    workflowName?: string;
    headBranch?: string;
    event?: string;
    createdAt?: string;
    displayTitle?: string;
    url?: string;
};

type ParsedOptions = Record<string, string | boolean | string[]>;

type GhResponse = {
    stdout: string;
    stderr: string;
    status: number;
};

type ErrorCategory =
    | "validation_error"
    | "auth_error"
    | "gh_cli_error"
    | "runtime_error";

type DeleteResult = {
    attempts: number;
    error?: string;
    ok: boolean;
};

type RunSummary = {
    attempted: number;
    deleted: number;
    dryRun: boolean;
    durationMs: number;
    failed: number;
    failedIds: number[];
    matched: number;
    repo: string;
    skippedByExclusion: number;
    statuses: string[];
    skippedByAge: number;
};

const VALID_STATUSES = new Set([
    "queued",
    "completed",
    "in_progress",
    "requested",
    "waiting",
    "pending",
    "action_required",
    "cancelled",
    "failure",
    "neutral",
    "skipped",
    "stale",
    "startup_failure",
    "success",
    "timed_out",
]);

function parseArguments(args: string[]): ParsedOptions {
    const parsed: ParsedOptions = {};

    for (let index = 0; index < args.length; index += 1) {
        const token = args[index];

        if (!token?.startsWith("--")) {
            continue;
        }

        const [rawKey, inlineValue] = token.slice(2).split("=", 2);
        const key = (rawKey ?? "").trim();

        if (
            key === "dry-run" ||
            key === "confirm" ||
            key === "yes" ||
            key === "verbose" ||
            key === "quiet" ||
            key === "all-statuses" ||
            key === "fail-fast" ||
            key === "help" ||
            key === "json"
        ) {
            parsed[key] = true;
            continue;
        }

        const nextToken = args[index + 1];
        const value =
            inlineValue ??
            (nextToken && !nextToken.startsWith("--") ? nextToken : "");

        if (
            inlineValue === undefined &&
            nextToken &&
            !nextToken.startsWith("--")
        ) {
            index += 1;
        }

        if (
            key === "status" ||
            key === "exclude-workflow" ||
            key === "exclude-branch"
        ) {
            const existing = parsed[key];
            const bucket = Array.isArray(existing) ? existing : [];
            bucket.push(value);
            parsed[key] = bucket;
            continue;
        }

        parsed[key] = value;
    }

    return parsed;
}

function printHelp(): string {
    return `gh-runs-cleanup

Delete GitHub Actions workflow runs using gh CLI.

Target repository:
    --repo <owner/name>           Target repository (optional if run inside a repo)

Filters:
  --status <value[,value...]>   Run statuses to target (repeatable)
                                default: failure,cancelled
  --workflow <name|id>          Filter by workflow name or id
    --exclude-workflow <name[,name...]>  Exclude matching workflow names (repeatable)
  --branch <name>               Filter by branch
    --exclude-branch <name[,name...]>    Exclude matching branch names (repeatable)
  --event <event>               Filter by triggering event
  --user <login>                Filter by actor
  --commit <sha>                Filter by commit SHA
  --created <date>              GitHub created-date filter (same as gh run list)
  --limit <n>                   Max runs to fetch per status (default: 200)
    --before-days <n>             Only delete runs older than N days
  --max-delete <n>              Safety cap on number of deletions
    --order <oldest|newest|none>  Processing order (default: oldest)

Execution:
  --dry-run                     Show what would be deleted without deleting
  --confirm                     Required to perform deletion
    --yes                         Alias for --confirm
    --max-retries <n>             Delete retry attempts (default: 2)
    --retry-delay-ms <n>          Initial retry delay in ms (default: 200)
    --fail-fast                   Stop deleting after first failed run
    --max-failures <n>            Stop after N failed deletions
  --verbose                     Show per-run details
    --quiet                       Reduce non-error output in text mode
  --json                        Emit structured JSON output
    --all-statuses                Target all valid statuses
  --help                        Show this help

Examples:
    gh runs-cleanup --repo owner/repo --confirm
    gh runs-cleanup --repo owner/repo --status failure,cancelled --limit 500 --confirm
    gh runs-cleanup --repo owner/repo --workflow "CI" --branch main --dry-run
    gh runs-cleanup --repo owner/repo --json --dry-run
    gh runs-cleanup --before-days 30 --status failure --confirm
`;
}

function runGh(args: string[], capture = true): GhResponse {
    const result = spawnSync("gh", args, {
        encoding: "utf8",
        stdio: capture ? "pipe" : "inherit",
    });

    return {
        stdout: result.stdout,
        stderr: result.stderr,
        status: result.status ?? 1,
    };
}

function emitError(
    message: string,
    category: ErrorCategory,
    asJson: boolean
): number {
    if (asJson) {
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

    console.error(`Error: ${message}`);
    return 1;
}

function resolveRepo(optionRepo: string | undefined): string | undefined {
    if (typeof optionRepo === "string" && optionRepo.length > 0) {
        return optionRepo;
    }

    const response = runGh([
        "repo",
        "view",
        "--json",
        "nameWithOwner",
        "--jq",
        ".nameWithOwner",
    ]);

    if (response.status !== 0) {
        return undefined;
    }

    const resolved = response.stdout.trim();
    return resolved.length > 0 ? resolved : undefined;
}

function isValidRepoSlug(value: string): boolean {
    return /^[^\s/]+\/[^\s/]+$/u.test(value);
}

function collectStringListOption(
    options: ParsedOptions,
    key: string
): string[] {
    const rawValues = options[key];
    if (Array.isArray(rawValues)) {
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

function getCreatedAtEpoch(run: WorkflowRun): number {
    if (typeof run.createdAt !== "string" || run.createdAt.length === 0) {
        return Number.NaN;
    }

    return Date.parse(run.createdAt);
}

function sortRuns(
    runs: WorkflowRun[],
    order: "oldest" | "newest" | "none"
): WorkflowRun[] {
    if (order === "none") {
        return runs;
    }

    return [...runs].sort((left, right) => {
        const leftEpoch = getCreatedAtEpoch(left);
        const rightEpoch = getCreatedAtEpoch(right);

        if (Number.isNaN(leftEpoch) && Number.isNaN(rightEpoch)) {
            return left.databaseId - right.databaseId;
        }

        if (Number.isNaN(leftEpoch)) {
            return 1;
        }

        if (Number.isNaN(rightEpoch)) {
            return -1;
        }

        return order === "oldest"
            ? leftEpoch - rightEpoch
            : rightEpoch - leftEpoch;
    });
}

function listRuns(
    repo: string,
    status: string,
    options: ParsedOptions
): WorkflowRun[] {
    const args = [
        "run",
        "list",
        "--repo",
        repo,
        "--status",
        status,
        "--limit",
        String(options["limit"] ?? "200"),
        "--json",
        "databaseId,status,conclusion,workflowName,headBranch,event,createdAt,displayTitle,url",
    ];

    const mappings: Array<[keyof ParsedOptions, string]> = [
        ["workflow", "--workflow"],
        ["branch", "--branch"],
        ["event", "--event"],
        ["user", "--user"],
        ["commit", "--commit"],
        ["created", "--created"],
    ];

    for (const [key, flag] of mappings) {
        const value = options[key];
        if (typeof value === "string" && value.length > 0) {
            args.push(flag, value);
        }
    }

    const response = runGh(args);
    if (response.status !== 0) {
        throw new Error(
            response.stderr || `gh run list failed for status ${status}`
        );
    }

    const parsed: unknown = JSON.parse(response.stdout || "[]");
    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => entry as WorkflowRun);
}

function waitMs(milliseconds: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function isRetryableDeleteError(stderr: string): boolean {
    const retryPattern =
        /timed out|timeout|rate limit|temporar|unavailable|internal server error|502|503|504|connection reset/iu;
    return retryPattern.test(stderr);
}

function deleteRunWithRetry(
    repo: string,
    runId: number,
    maxRetries: number,
    baseDelayMs: number
): DeleteResult {
    const endpoint = `/repos/${repo}/actions/runs/${runId}`;
    let lastError = "";

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const response = runGh([
            "api",
            "-X",
            "DELETE",
            endpoint,
        ]);
        if (response.status === 0) {
            return { attempts: attempt + 1, ok: true };
        }

        lastError =
            response.stderr ||
            `gh api delete failed with status ${response.status}`;
        const shouldRetry =
            attempt < maxRetries && isRetryableDeleteError(lastError);

        if (!shouldRetry) {
            return { attempts: attempt + 1, error: lastError, ok: false };
        }

        waitMs(baseDelayMs * 2 ** attempt);
    }

    return {
        attempts: maxRetries + 1,
        error: lastError || "unknown delete error",
        ok: false,
    };
}

function printTextSummary(summary: RunSummary): void {
    console.log(`Repo: ${summary.repo}`);
    console.log(`Statuses: ${summary.statuses.join(", ")}`);
    console.log(`Matched runs: ${summary.matched}`);
    console.log(`Skipped by exclusion filters: ${summary.skippedByExclusion}`);
    console.log(`Skipped by age filter: ${summary.skippedByAge}`);
    if (!summary.dryRun) {
        console.log(`Attempted deletions: ${summary.attempted}`);
        console.log(`Deleted: ${summary.deleted}`);
        console.log(`Failed: ${summary.failed}`);
        if (summary.failedIds.length > 0) {
            console.log(
                `Failed IDs (first 50): ${summary.failedIds.slice(0, 50).join(", ")}`
            );
        }
    }
}

export function main(argv: string[]): number {
    const startedAt = Date.now();
    const options = parseArguments(argv);
    const jsonOutput = options["json"] === true;

    if (options["help"] === true) {
        console.log(printHelp());
        return 0;
    }

    const dryRun = options["dry-run"] === true;
    const confirm = options["confirm"] === true || options["yes"] === true;
    const verbose = options["verbose"] === true;
    const quiet = options["quiet"] === true;
    const failFast = options["fail-fast"] === true;

    if (!dryRun && !confirm) {
        return emitError(
            "Safety stop: pass --confirm to perform deletion, or use --dry-run to preview.",
            "validation_error",
            jsonOutput
        );
    }

    const allStatuses = options["all-statuses"] === true;

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

    const rawStatusValues = allStatuses
        ? [Array.from(VALID_STATUSES).join(",")]
        : Array.isArray(options["status"])
          ? options["status"]
          : typeof options["status"] === "string"
            ? [options["status"]]
            : ["failure,cancelled"];

    const statuses = rawStatusValues
        .flatMap((part) => part.split(","))
        .map((part) => part.trim())
        .filter(Boolean);

    if (statuses.length === 0) {
        return emitError(
            "at least one --status value is required.",
            "validation_error",
            jsonOutput
        );
    }

    const invalidStatuses = statuses.filter(
        (status) => !VALID_STATUSES.has(status)
    );
    if (invalidStatuses.length > 0) {
        return emitError(
            `invalid statuses: ${invalidStatuses.join(", ")}. Valid values: ${Array.from(VALID_STATUSES).join(", ")}`,
            "validation_error",
            jsonOutput
        );
    }

    const limit = Number.parseInt(String(options["limit"] ?? "200"), 10);
    if (!Number.isFinite(limit) || limit < 1) {
        return emitError(
            "--limit must be a positive integer.",
            "validation_error",
            jsonOutput
        );
    }

    const maxDeleteOption = options["max-delete"];
    const maxDelete =
        typeof maxDeleteOption === "string"
            ? Number.parseInt(maxDeleteOption, 10)
            : undefined;
    if (
        maxDeleteOption !== undefined &&
        (typeof maxDelete !== "number" ||
            !Number.isFinite(maxDelete) ||
            maxDelete < 1)
    ) {
        return emitError(
            "--max-delete must be a positive integer.",
            "validation_error",
            jsonOutput
        );
    }

    const beforeDaysOption = options["before-days"];
    const beforeDays =
        typeof beforeDaysOption === "string"
            ? Number.parseInt(beforeDaysOption, 10)
            : undefined;
    if (
        beforeDaysOption !== undefined &&
        (typeof beforeDays !== "number" ||
            !Number.isFinite(beforeDays) ||
            beforeDays < 0)
    ) {
        return emitError(
            "--before-days must be a non-negative integer.",
            "validation_error",
            jsonOutput
        );
    }

    const maxRetriesOption = options["max-retries"];
    const maxRetries =
        typeof maxRetriesOption === "string"
            ? Number.parseInt(maxRetriesOption, 10)
            : 2;
    if (!Number.isFinite(maxRetries) || maxRetries < 0) {
        return emitError(
            "--max-retries must be a non-negative integer.",
            "validation_error",
            jsonOutput
        );
    }

    const retryDelayOption = options["retry-delay-ms"];
    const retryDelayMs =
        typeof retryDelayOption === "string"
            ? Number.parseInt(retryDelayOption, 10)
            : 200;
    if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
        return emitError(
            "--retry-delay-ms must be a non-negative integer.",
            "validation_error",
            jsonOutput
        );
    }

    const maxFailuresOption = options["max-failures"];
    const maxFailures =
        typeof maxFailuresOption === "string"
            ? Number.parseInt(maxFailuresOption, 10)
            : undefined;
    if (
        maxFailuresOption !== undefined &&
        (typeof maxFailures !== "number" ||
            !Number.isFinite(maxFailures) ||
            maxFailures < 1)
    ) {
        return emitError(
            "--max-failures must be a positive integer.",
            "validation_error",
            jsonOutput
        );
    }

    const orderOption = options["order"];
    const order =
        typeof orderOption === "string" && orderOption.length > 0
            ? orderOption.toLowerCase()
            : "oldest";
    if (order !== "oldest" && order !== "newest" && order !== "none") {
        return emitError(
            "--order must be one of: oldest, newest, none.",
            "validation_error",
            jsonOutput
        );
    }

    const repoOption =
        typeof options["repo"] === "string"
            ? options["repo"].trim()
            : undefined;
    if (typeof repoOption === "string" && !isValidRepoSlug(repoOption)) {
        return emitError(
            "--repo must be in owner/name format.",
            "validation_error",
            jsonOutput
        );
    }

    const resolvedRepo = resolveRepo(repoOption);
    if (typeof resolvedRepo !== "string" || resolvedRepo.length === 0) {
        if (!jsonOutput) {
            console.log(printHelp());
        }
        return emitError(
            "unable to resolve repository. Provide --repo <owner/name> or run inside a GitHub repository.",
            "validation_error",
            jsonOutput
        );
    }

    options["limit"] = String(limit);

    const authResult = runGh(["auth", "status"]);
    if (authResult.status !== 0) {
        return emitError(
            "gh CLI is not authenticated. Run: gh auth login",
            "auth_error",
            jsonOutput
        );
    }

    const allRuns: WorkflowRun[] = [];
    try {
        for (const status of statuses) {
            const runs = listRuns(resolvedRepo, status, options);
            allRuns.push(...runs);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return emitError(
            `failed to list runs: ${message}`,
            "gh_cli_error",
            jsonOutput
        );
    }

    const uniqueById = new Map<number, WorkflowRun>();
    for (const run of allRuns) {
        uniqueById.set(run.databaseId, run);
    }

    const dedupedRuns = Array.from(uniqueById.values());
    const orderedRuns = sortRuns(dedupedRuns, order);

    let skippedByExclusion = 0;
    const includedRuns = orderedRuns.filter((run) => {
        const workflowName = run.workflowName?.toLowerCase();
        const branchName = run.headBranch?.toLowerCase();

        const excludedByWorkflow =
            typeof workflowName === "string" &&
            excludedWorkflowNames.has(workflowName);
        const excludedByBranch =
            typeof branchName === "string" &&
            excludedBranchNames.has(branchName);

        if (excludedByWorkflow || excludedByBranch) {
            skippedByExclusion += 1;
            return false;
        }

        return true;
    });

    let skippedByAge = 0;
    const now = Date.now();
    const ageCutoffEpoch =
        typeof beforeDays === "number"
            ? now - beforeDays * 24 * 60 * 60 * 1000
            : undefined;
    const runsToProcess =
        typeof ageCutoffEpoch === "number"
            ? includedRuns.filter((run) => {
                  const createdEpoch = getCreatedAtEpoch(run);
                  const include = Number.isFinite(createdEpoch)
                      ? createdEpoch <= ageCutoffEpoch
                      : true;
                  if (!include) {
                      skippedByAge += 1;
                  }
                  return include;
              })
            : includedRuns;

    if (verbose && !jsonOutput && !quiet) {
        for (const run of runsToProcess.slice(0, 50)) {
            console.log(
                `- ${run.databaseId} | ${run.status ?? ""}/${run.conclusion ?? ""} | ${run.workflowName ?? ""} | ${run.headBranch ?? ""} | ${run.createdAt ?? ""}`
            );
        }
        if (runsToProcess.length > 50) {
            console.log(`... and ${runsToProcess.length - 50} more`);
        }
    }

    const candidates =
        Number.isFinite(maxDelete) && maxDelete !== undefined
            ? runsToProcess.slice(0, maxDelete)
            : runsToProcess;

    let deleted = 0;
    const failedIds: number[] = [];
    let attempted = 0;

    if (!dryRun) {
        for (const run of candidates) {
            attempted += 1;
            const result = deleteRunWithRetry(
                resolvedRepo,
                run.databaseId,
                maxRetries,
                retryDelayMs
            );
            if (result.ok) {
                deleted += 1;
            } else {
                failedIds.push(run.databaseId);
                if (verbose && !jsonOutput) {
                    console.error(
                        `Delete failed for run ${run.databaseId} after ${result.attempts} attempt(s): ${result.error ?? "unknown"}`
                    );
                }

                if (failFast) {
                    break;
                }

                if (
                    typeof maxFailures === "number" &&
                    failedIds.length >= maxFailures
                ) {
                    break;
                }
            }
        }
    }

    const summary: RunSummary = {
        attempted,
        deleted,
        dryRun,
        durationMs: Date.now() - startedAt,
        failed: failedIds.length,
        failedIds,
        matched: runsToProcess.length,
        repo: resolvedRepo,
        skippedByExclusion,
        statuses,
        skippedByAge,
    };

    if (jsonOutput) {
        console.log(JSON.stringify(summary, null, 2));
    } else {
        if (!quiet) {
            printTextSummary(summary);
        }
        if (dryRun && !quiet) {
            console.log("Dry run complete: no deletions performed.");
        }
    }

    return failedIds.length > 0 ? 2 : 0;
}

export function runCli(): void {
    try {
        const code = main(process.argv.slice(2));
        process.exit(code);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const jsonMode = process.argv.includes("--json");
        if (jsonMode) {
            console.error(
                JSON.stringify(
                    {
                        error: {
                            category: "runtime_error",
                            message,
                        },
                    },
                    null,
                    2
                )
            );
        } else {
            console.error(`Error: ${message}`);
        }
        process.exit(1);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runCli();
}
