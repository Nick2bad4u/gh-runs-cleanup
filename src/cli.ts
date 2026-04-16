#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

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

type ColorMode = "auto" | "always" | "never";
type UnicodeMode = "auto" | "always" | "never";

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
    planned: number;
    skippedByExclusion: number;
    statuses: string[];
    skippedByAge: number;
};

type Styler = {
    heading: (text: string) => string;
    strong: (text: string) => string;
    info: (text: string) => string;
    muted: (text: string) => string;
    ok: (text: string) => string;
    warn: (text: string) => string;
    error: (text: string) => string;
    status: (text: string) => string;
    count: (value: number) => string;
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
            key === "json" ||
            key === "summary" ||
            key === "no-color" ||
            key === "no-unicode" ||
            key === "no-progress" ||
            key === "ci"
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
    --limit <n>                   Max runs to fetch per status (default: 500)
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
    --summary                     Show expanded summaries (tables, grouped counts)
    --quiet                       Reduce non-error output in text mode
  --json                        Emit structured JSON output
    --color <auto|always|never>   Color mode for text output (default: auto)
    --no-color                    Alias for --color never
        --unicode <auto|always|never> Unicode table borders/symbols (default: auto)
        --no-unicode                  Alias for --unicode never
        --no-progress                 Disable progress bars in interactive terminals
        --ci                          CI-friendly output (disables interactive formatting)
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

function renderHelpText(styler: Styler): string {
    const helpText = printHelp();
    const sectionLines = new Set([
        "Target repository:",
        "Filters:",
        "Execution:",
        "Examples:",
    ]);

    return helpText
        .split("\n")
        .map((line, index) => {
            if (line.length === 0) {
                return line;
            }

            if (index === 0) {
                return styler.heading(line);
            }

            if (sectionLines.has(line.trim())) {
                return styler.info(line);
            }

            const optionMatch = line.match(
                /^(\s*)(--[a-z0-9-]+(?:\s+<[^>]+>)?)(\s{2,})(.*)$/u
            );
            if (optionMatch) {
                const leading = optionMatch[1] ?? "";
                const option = optionMatch[2] ?? "";
                const spacing = optionMatch[3] ?? "  ";
                const description = optionMatch[4] ?? "";
                return `${leading}${styler.strong(option)}${spacing}${description}`;
            }

            if (line.trimStart().startsWith("gh runs-cleanup")) {
                return styler.muted(line);
            }

            if (line.trimStart().startsWith("default:")) {
                return styler.muted(line);
            }

            return line;
        })
        .join("\n");
}

function createStyler(useColor: boolean): Styler {
    const apply = (code: string, text: string): string =>
        useColor ? `\u001b[${code}m${text}\u001b[0m` : text;

    const status = (text: string): string => {
        const normalized = text.toLowerCase();
        if (
            normalized.includes("failure") ||
            normalized.includes("timed_out")
        ) {
            return apply("31", text);
        }
        if (normalized.includes("cancelled") || normalized.includes("stale")) {
            return apply("33", text);
        }
        if (normalized.includes("success")) {
            return apply("32", text);
        }
        if (
            normalized.includes("in_progress") ||
            normalized.includes("queued")
        ) {
            return apply("36", text);
        }
        return apply("90", text);
    };

    return {
        heading: (text) => apply("1;36", text),
        strong: (text) => apply("1", text),
        info: (text) => apply("36", text),
        muted: (text) => apply("90", text),
        ok: (text) => apply("32", text),
        warn: (text) => apply("33", text),
        error: (text) => apply("31", text),
        status,
        count: (value) =>
            value === 0
                ? apply("90", String(value))
                : value > 0
                  ? apply("1;36", String(value))
                  : String(value),
    };
}

function visibleLength(value: string): number {
    return stripVTControlCharacters(value).length;
}

function padVisible(value: string, width: number): string {
    const difference = width - visibleLength(value);
    return difference > 0 ? `${value}${" ".repeat(difference)}` : value;
}

function shouldUseColor(mode: ColorMode, asJson: boolean): boolean {
    if (asJson) {
        return false;
    }

    if (mode === "always") {
        return true;
    }

    if (mode === "never") {
        return false;
    }

    if (process.env["NO_COLOR"] !== undefined) {
        return false;
    }

    const forced = process.env["FORCE_COLOR"];
    if (typeof forced === "string") {
        return forced !== "0";
    }

    return process.stdout.isTTY;
}

function shouldUseUnicode(mode: UnicodeMode, asJson: boolean): boolean {
    if (asJson) {
        return false;
    }

    if (mode === "always") {
        return true;
    }

    if (mode === "never") {
        return false;
    }

    const term = process.env["TERM"];
    if (term === "dumb") {
        return false;
    }

    return process.stdout.isTTY;
}

function formatTable(
    headers: string[],
    rows: string[][],
    useUnicode: boolean
): string {
    const widths = headers.map((header, column) =>
        Math.max(
            visibleLength(header),
            ...rows.map((row) => visibleLength(row[column] ?? ""))
        )
    );

    const style = useUnicode
        ? {
              tl: "┌",
              tr: "┐",
              bl: "└",
              br: "┘",
              h: "─",
              v: "│",
              j: "┼",
              tt: "┬",
              bt: "┴",
              lt: "├",
              rt: "┤",
          }
        : {
              tl: "+",
              tr: "+",
              bl: "+",
              br: "+",
              h: "-",
              v: "|",
              j: "+",
              tt: "+",
              bt: "+",
              lt: "+",
              rt: "+",
          };

    const horizontal = widths.map((width) => style.h.repeat(width + 2));
    const top = `${style.tl}${horizontal.join(style.tt)}${style.tr}`;
    const middle = `${style.lt}${horizontal.join(style.j)}${style.rt}`;
    const bottom = `${style.bl}${horizontal.join(style.bt)}${style.br}`;

    const renderRow = (cells: string[]): string =>
        `${style.v} ${cells
            .map((cell, index) => padVisible(cell, widths[index] ?? 0))
            .join(` ${style.v} `)} ${style.v}`;

    const lines = [
        top,
        renderRow(headers),
        middle,
        ...rows.map((row) => renderRow(row)),
        bottom,
    ];

    return lines.join("\n");
}

function toWorkflowName(run: WorkflowRun): string {
    const value = run.workflowName?.trim();
    return typeof value === "string" && value.length > 0
        ? value
        : "(unknown workflow)";
}

function toBranchName(run: WorkflowRun): string {
    const value = run.headBranch?.trim();
    return typeof value === "string" && value.length > 0
        ? value
        : "(no branch)";
}

function toStatusLabel(run: WorkflowRun): string {
    const status = run.status?.trim() || "unknown";
    const conclusion = run.conclusion?.trim();
    return conclusion ? `${status}/${conclusion}` : status;
}

function collectCounts(
    runs: WorkflowRun[],
    selector: (run: WorkflowRun) => string
): Array<[name: string, count: number]> {
    const counts = new Map<string, number>();

    for (const run of runs) {
        const key = selector(run);
        const current = counts.get(key) ?? 0;
        counts.set(key, current + 1);
    }

    return Array.from(counts.entries()).sort((left, right) => {
        if (right[1] !== left[1]) {
            return right[1] - left[1];
        }
        return left[0].localeCompare(right[0]);
    });
}

function printDryRunWorkflowSummary(
    runs: WorkflowRun[],
    styler: Styler,
    useUnicode: boolean
): void {
    console.log("");
    console.log(styler.heading("Planned deletions by workflow"));

    const counts = collectCounts(runs, toWorkflowName);
    if (counts.length === 0) {
        console.log(
            styler.muted("No workflow runs matched the current filters.")
        );
        return;
    }

    console.log(
        formatTable(
            [styler.strong("Workflow"), styler.strong("Planned deletions")],
            counts.map(([workflow, count]) => [workflow, styler.count(count)]),
            useUnicode
        )
    );
}

function printSummaryDetails(
    runsToProcess: WorkflowRun[],
    candidates: WorkflowRun[],
    styler: Styler,
    useUnicode: boolean
): void {
    console.log("");
    console.log(styler.heading("Summary details"));

    const statusCounts = collectCounts(runsToProcess, toStatusLabel);
    const branchCounts = collectCounts(runsToProcess, toBranchName).slice(
        0,
        10
    );

    console.log(styler.info("By status"));
    console.log(
        formatTable(
            [styler.strong("Status"), styler.strong("Count")],
            statusCounts.map(([status, count]) => [
                styler.status(status),
                styler.count(count),
            ]),
            useUnicode
        )
    );

    console.log("");
    console.log(styler.info("Top branches"));
    console.log(
        formatTable(
            [styler.strong("Branch"), styler.strong("Count")],
            branchCounts.map(([branch, count]) => [
                branch,
                styler.count(count),
            ]),
            useUnicode
        )
    );

    if (candidates.length < runsToProcess.length) {
        console.log(
            styler.warn(
                `Limited by --max-delete: ${candidates.length} of ${runsToProcess.length} matched runs are planned.`
            )
        );
    }
}

function printVerboseRuns(
    runs: WorkflowRun[],
    styler: Styler,
    useUnicode: boolean
): void {
    const rows = runs.slice(0, 50).map((run) => [
        styler.strong(String(run.databaseId)),
        styler.status(toStatusLabel(run)),
        toWorkflowName(run),
        toBranchName(run),
        run.createdAt ?? "",
    ]);

    console.log("");
    console.log(styler.heading("Run details (first 50)"));
    console.log(
        formatTable(
            [
                styler.strong("Run ID"),
                styler.strong("Status"),
                styler.strong("Workflow"),
                styler.strong("Branch"),
                styler.strong("Created"),
            ],
            rows,
            useUnicode
        )
    );

    if (runs.length > 50) {
        console.log(styler.muted(`... and ${runs.length - 50} more`));
    }
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
    asJson: boolean,
    styler?: Styler
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

    const rendered = styler
        ? styler.error(`Error: ${message}`)
        : `Error: ${message}`;
    console.error(rendered);
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
        String(options["limit"] ?? "500"),
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

function shouldShowProgress(
    asJson: boolean,
    quiet: boolean,
    verbose: boolean,
    noProgress: boolean,
    ciMode: boolean
): boolean {
    return (
        !asJson &&
        !quiet &&
        !verbose &&
        !noProgress &&
        !ciMode &&
        process.stdout.isTTY
    );
}

type ProgressState = {
    done: () => void;
    update: (completed: number, suffix?: string) => void;
};

function createProgressBar(
    title: string,
    total: number,
    styler: Styler,
    enabled: boolean
): ProgressState {
    if (!enabled || total <= 0) {
        return {
            done: () => {},
            update: () => {},
        };
    }

    const width = 24;
    const totalSafe = Math.max(1, total);

    const render = (completed: number, suffix = ""): void => {
        const clamped = Math.min(Math.max(completed, 0), totalSafe);
        const percent = Math.floor((clamped / totalSafe) * 100);
        const filled = Math.round((clamped / totalSafe) * width);
        const bar = `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
        const progressText = `${clamped}/${totalSafe}`;
        const line = `${styler.info(title)} ${styler.muted("[")}${styler.ok(bar)}${styler.muted("]")} ${styler.strong(progressText)} ${styler.muted(`${percent}%`)}${suffix.length > 0 ? ` ${styler.muted(suffix)}` : ""}`;
        process.stdout.write(`\r${line}`);
    };

    render(0);

    return {
        update: (completed, suffix = "") => {
            render(completed, suffix);
        },
        done: () => {
            render(totalSafe);
            process.stdout.write("\n");
        },
    };
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
    baseDelayMs: number,
    onAttempt?: (attempt: number, totalAttempts: number) => void
): DeleteResult {
    const endpoint = `/repos/${repo}/actions/runs/${runId}`;
    let lastError = "";
    const totalAttempts = maxRetries + 1;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        onAttempt?.(attempt + 1, totalAttempts);
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

function printTextSummary(
    summary: RunSummary,
    styler: Styler,
    useUnicode: boolean
): void {
    const styledStatuses = summary.statuses.map((status) =>
        styler.status(status)
    );

    console.log(styler.heading("Cleanup summary"));
    console.log(
        formatTable(
            [styler.strong("Metric"), styler.strong("Value")],
            [
                [styler.info("Repository"), styler.strong(summary.repo)],
                [
                    styler.info("Statuses"),
                    styledStatuses.join(styler.muted(", ")),
                ],
                [
                    styler.info("Matched runs"),
                    styler.strong(styler.count(summary.matched)),
                ],
                [
                    styler.info("Planned deletions"),
                    styler.strong(styler.count(summary.planned)),
                ],
                [
                    styler.warn("Skipped by exclusion filters"),
                    summary.skippedByExclusion > 0
                        ? styler.warn(String(summary.skippedByExclusion))
                        : styler.muted(String(summary.skippedByExclusion)),
                ],
                [
                    styler.warn("Skipped by age filter"),
                    summary.skippedByAge > 0
                        ? styler.warn(String(summary.skippedByAge))
                        : styler.muted(String(summary.skippedByAge)),
                ],
            ],
            useUnicode
        )
    );

    if (!summary.dryRun) {
        console.log("");
        console.log(styler.info("Deletion results"));
        console.log(
            formatTable(
                [styler.strong("Metric"), styler.strong("Value")],
                [
                    [
                        styler.info("Attempted deletions"),
                        styler.strong(String(summary.attempted)),
                    ],
                    [
                        styler.ok("Deleted"),
                        summary.deleted > 0
                            ? styler.ok(String(summary.deleted))
                            : styler.muted(String(summary.deleted)),
                    ],
                    [
                        styler.error("Failed"),
                        summary.failed > 0
                            ? styler.error(String(summary.failed))
                            : styler.ok(String(summary.failed)),
                    ],
                ],
                useUnicode
            )
        );

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
    const ciMode = options["ci"] === true;
    const noProgress = options["no-progress"] === true;

    const colorOption =
        ciMode || options["no-color"] === true
            ? "never"
            : typeof options["color"] === "string" &&
                options["color"].length > 0
              ? options["color"].trim().toLowerCase()
              : "auto";

    const validColorOption =
        colorOption === "auto" ||
        colorOption === "always" ||
        colorOption === "never";

    const colorMode = (validColorOption ? colorOption : "auto") as ColorMode;
    const styler = createStyler(shouldUseColor(colorMode, jsonOutput));

    if (options["help"] === true) {
        console.log(renderHelpText(styler));
        return 0;
    }

    if (!validColorOption) {
        return emitError(
            "--color must be one of: auto, always, never.",
            "validation_error",
            jsonOutput,
            styler
        );
    }

    const dryRun = options["dry-run"] === true;
    const confirm = options["confirm"] === true || options["yes"] === true;
    const verbose = options["verbose"] === true;
    const summaryMode = options["summary"] === true;
    const quiet = options["quiet"] === true;
    const failFast = options["fail-fast"] === true;

    const unicodeOption =
        ciMode || options["no-unicode"] === true
            ? "never"
            : typeof options["unicode"] === "string" &&
                options["unicode"].length > 0
              ? options["unicode"].trim().toLowerCase()
              : "auto";

    if (
        unicodeOption !== "auto" &&
        unicodeOption !== "always" &&
        unicodeOption !== "never"
    ) {
        return emitError(
            "--unicode must be one of: auto, always, never.",
            "validation_error",
            jsonOutput,
            styler
        );
    }

    const unicodeMode = unicodeOption as UnicodeMode;
    const unicodeTables = shouldUseUnicode(unicodeMode, jsonOutput);

    if (!dryRun && !confirm) {
        return emitError(
            "Safety stop: pass --confirm to perform deletion, or use --dry-run to preview.",
            "validation_error",
            jsonOutput,
            styler
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
            jsonOutput,
            styler
        );
    }

    const invalidStatuses = statuses.filter(
        (status) => !VALID_STATUSES.has(status)
    );
    if (invalidStatuses.length > 0) {
        return emitError(
            `invalid statuses: ${invalidStatuses.join(", ")}. Valid values: ${Array.from(VALID_STATUSES).join(", ")}`,
            "validation_error",
            jsonOutput,
            styler
        );
    }

    const limit = Number.parseInt(String(options["limit"] ?? "500"), 10);
    if (!Number.isFinite(limit) || limit < 1) {
        return emitError(
            "--limit must be a positive integer.",
            "validation_error",
            jsonOutput,
            styler
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
            jsonOutput,
            styler
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
            jsonOutput,
            styler
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
            jsonOutput,
            styler
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
            jsonOutput,
            styler
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
            jsonOutput,
            styler
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
            jsonOutput,
            styler
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
            jsonOutput,
            styler
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
            jsonOutput,
            styler
        );
    }

    options["limit"] = String(limit);

    const authResult = runGh(["auth", "status"]);
    if (authResult.status !== 0) {
        return emitError(
            "gh CLI is not authenticated. Run: gh auth login",
            "auth_error",
            jsonOutput,
            styler
        );
    }

    const allRuns: WorkflowRun[] = [];
    const showProgress = shouldShowProgress(
        jsonOutput,
        quiet,
        verbose,
        noProgress,
        ciMode
    );
    const fetchProgress = createProgressBar(
        "Fetching runs",
        statuses.length,
        styler,
        showProgress
    );

    try {
        for (const [index, status] of statuses.entries()) {
            const runs = listRuns(resolvedRepo, status, options);
            allRuns.push(...runs);
            fetchProgress.update(
                index + 1,
                `status=${status} totalRuns=${allRuns.length}`
            );
        }
        fetchProgress.done();
    } catch (error) {
        fetchProgress.done();
        const message = error instanceof Error ? error.message : String(error);
        return emitError(
            `failed to list runs: ${message}`,
            "gh_cli_error",
            jsonOutput,
            styler
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

    const candidates =
        Number.isFinite(maxDelete) && maxDelete !== undefined
            ? runsToProcess.slice(0, maxDelete)
            : runsToProcess;

    if (verbose && !jsonOutput && !quiet) {
        printVerboseRuns(candidates, styler, unicodeTables);
    }

    let deleted = 0;
    const failedIds: number[] = [];
    let attempted = 0;

    const deleteProgress = createProgressBar(
        "Deleting runs",
        candidates.length,
        styler,
        showProgress && !dryRun
    );

    if (!jsonOutput && !quiet) {
        console.log(
            styler.info(
                `Planned deletions: ${candidates.length} (from ${allRuns.length} fetched runs, ${dedupedRuns.length} unique).`
            )
        );
    }

    if (!dryRun) {
        for (const run of candidates) {
            attempted += 1;

            deleteProgress.update(
                attempted - 1,
                `run=${run.databaseId} attempt=1/${maxRetries + 1} deleted=${deleted} failed=${failedIds.length}`
            );

            const result = deleteRunWithRetry(
                resolvedRepo,
                run.databaseId,
                maxRetries,
                retryDelayMs,
                (attemptNumber, totalAttempts) => {
                    deleteProgress.update(
                        attempted - 1,
                        `run=${run.databaseId} attempt=${attemptNumber}/${totalAttempts} deleted=${deleted} failed=${failedIds.length}`
                    );
                }
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

            deleteProgress.update(
                attempted,
                `deleted=${deleted} failed=${failedIds.length}`
            );
        }

        deleteProgress.done();
    }

    const summary: RunSummary = {
        attempted,
        deleted,
        dryRun,
        durationMs: Date.now() - startedAt,
        failed: failedIds.length,
        failedIds,
        matched: runsToProcess.length,
        planned: candidates.length,
        repo: resolvedRepo,
        skippedByExclusion,
        statuses,
        skippedByAge,
    };

    if (jsonOutput) {
        console.log(JSON.stringify(summary, null, 2));
    } else {
        if (!quiet) {
            printTextSummary(summary, styler, unicodeTables);
            if (dryRun) {
                printDryRunWorkflowSummary(candidates, styler, unicodeTables);
            }
            if (summaryMode) {
                printSummaryDetails(
                    runsToProcess,
                    candidates,
                    styler,
                    unicodeTables
                );
            }
        }
        if (dryRun && !quiet) {
            console.log(styler.ok("Dry run complete: no deletions performed."));
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
