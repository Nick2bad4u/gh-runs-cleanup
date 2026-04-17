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
    flag: (text: string) => string;
    arg: (text: string) => string;
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
            key === "ci" ||
            key === "all-repos"
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
            key === "exclude-branch" ||
            key === "repos"
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

type HelpOption = {
    arg?: string;
    description: string;
    flag: string;
};

type HelpSection = {
    options?: HelpOption[];
    title: string;
};

const HELP_SECTIONS: HelpSection[] = [
    {
        options: [
            {
                arg: "<owner/name>",
                description:
                    "Target repository (optional if run inside a repo)",
                flag: "--repo",
            },
            {
                arg: "<owner/name[,..]>",
                description: "Multiple target repositories (repeatable)",
                flag: "--repos",
            },
            {
                description: "Target all repositories for an owner/login",
                flag: "--all-repos",
            },
            {
                arg: "<login>",
                description:
                    "Owner/login used with --all-repos (default: authenticated user)",
                flag: "--owner",
            },
        ],
        title: "Target repository",
    },
    {
        options: [
            {
                arg: "<value[,value...]>",
                description:
                    "Run statuses to target (repeatable; default: failure,cancelled)",
                flag: "--status",
            },
            {
                description: "Target all valid statuses",
                flag: "--all-statuses",
            },
            {
                arg: "<name|id>",
                description: "Filter by workflow name or id",
                flag: "--workflow",
            },
            {
                arg: "<name[,name...]>",
                description: "Exclude matching workflow names (repeatable)",
                flag: "--exclude-workflow",
            },
            {
                arg: "<name>",
                description: "Filter by branch",
                flag: "--branch",
            },
            {
                arg: "<name[,name...]>",
                description: "Exclude matching branch names (repeatable)",
                flag: "--exclude-branch",
            },
            {
                arg: "<event>",
                description: "Filter by triggering event",
                flag: "--event",
            },
            {
                arg: "<login>",
                description: "Filter by actor",
                flag: "--user",
            },
            {
                arg: "<sha>",
                description: "Filter by commit SHA",
                flag: "--commit",
            },
            {
                arg: "<date>",
                description: "GitHub created-date filter (same as gh run list)",
                flag: "--created",
            },
            {
                arg: "<n>",
                description: "Only delete runs older than N days",
                flag: "--before-days",
            },
            {
                arg: "<n>",
                description: "Max runs to fetch per status (default: 500)",
                flag: "--limit",
            },
            {
                arg: "<n>",
                description: "Safety cap on number of deletions",
                flag: "--max-delete",
            },
            {
                arg: "<oldest|newest|none>",
                description: "Processing order (default: oldest)",
                flag: "--order",
            },
        ],
        title: "Filters",
    },
    {
        options: [
            {
                description: "Show what would be deleted without deleting",
                flag: "--dry-run",
            },
            {
                description: "Required to perform deletion",
                flag: "--confirm",
            },
            {
                description: "Alias for --confirm",
                flag: "--yes",
            },
            {
                arg: "<n>",
                description: "Delete retry attempts (default: 2)",
                flag: "--max-retries",
            },
            {
                arg: "<n>",
                description: "Initial retry delay in ms (default: 200)",
                flag: "--retry-delay-ms",
            },
            {
                description: "Stop deleting after first failed run",
                flag: "--fail-fast",
            },
            {
                arg: "<n>",
                description: "Stop after N failed deletions",
                flag: "--max-failures",
            },
            {
                description: "Show per-run details",
                flag: "--verbose",
            },
            {
                description: "Show expanded summaries (tables, grouped counts)",
                flag: "--summary",
            },
            {
                description: "Reduce non-error output in text mode",
                flag: "--quiet",
            },
        ],
        title: "Execution",
    },
    {
        options: [
            {
                description: "Emit structured JSON output",
                flag: "--json",
            },
            {
                arg: "<auto|always|never>",
                description: "Color mode for text output (default: auto)",
                flag: "--color",
            },
            {
                description: "Alias for --color never",
                flag: "--no-color",
            },
            {
                arg: "<auto|always|never>",
                description: "Unicode table borders/symbols (default: auto)",
                flag: "--unicode",
            },
            {
                description: "Alias for --unicode never",
                flag: "--no-unicode",
            },
            {
                description: "Disable progress bars in interactive terminals",
                flag: "--no-progress",
            },
            {
                description:
                    "CI-friendly output (disables interactive formatting)",
                flag: "--ci",
            },
        ],
        title: "Output",
    },
    {
        options: [
            {
                description: "Show this help",
                flag: "--help",
            },
        ],
        title: "Help",
    },
];

const HELP_NOTES = [
    "--workflow uses compatibility mode, so progress may update less frequently.",
];

const HELP_EXAMPLES = [
    "gh runs-cleanup --repo owner/repo --confirm",
    "gh runs-cleanup --repos owner/repo,owner/other-repo --dry-run",
    "gh runs-cleanup --all-repos --owner my-user --status failure --confirm",
    "gh runs-cleanup --repo owner/repo --status failure,cancelled --limit 500 --confirm",
    'gh runs-cleanup --repo owner/repo --workflow "CI" --branch main --dry-run',
    "gh runs-cleanup --repo owner/repo --json --dry-run",
    "gh runs-cleanup --before-days 30 --status failure --confirm",
];

function styleCommandExample(command: string, styler?: Styler): string {
    if (!styler) {
        return command;
    }

    return command
        .split(/(\s+)/u)
        .map((token) =>
            token.startsWith("--")
                ? styler.flag(token)
                : token.startsWith("<") && token.endsWith(">")
                  ? styler.arg(token)
                  : token
        )
        .join("");
}

function buildHelpText(styler?: Styler): string {
    const heading = (text: string): string =>
        styler ? styler.info(text) : text;
    const flag = (text: string): string => (styler ? styler.flag(text) : text);
    const arg = (text: string): string => (styler ? styler.arg(text) : text);
    const title = (text: string): string =>
        styler ? styler.heading(text) : text;

    const optionLabelWidths = HELP_SECTIONS.flatMap((section) =>
        (section.options ?? []).map(
            (option) =>
                `${option.flag}${option.arg ? ` ${option.arg}` : ""}`.length
        )
    );
    const maxLabelWidth = Math.max(...optionLabelWidths, 0);

    const lines: string[] = [];
    lines.push(title("gh-runs-cleanup"));
    lines.push("");
    lines.push("  Delete GitHub Actions workflow runs using the gh CLI.");
    lines.push("");
    lines.push(heading("  Usage:"));
    lines.push(
        `    ${styleCommandExample("gh runs-cleanup", styler)} ${arg("[options]")}`
    );
    lines.push("");

    for (const section of HELP_SECTIONS) {
        lines.push(heading(`  ${section.title}:`));
        for (const option of section.options ?? []) {
            const labelPlain = `${option.flag}${option.arg ? ` ${option.arg}` : ""}`;
            const labelStyled = `${flag(option.flag)}${option.arg ? ` ${arg(option.arg)}` : ""}`;
            const spacing = " ".repeat(maxLabelWidth - labelPlain.length + 2);
            lines.push(`    ${labelStyled}${spacing}${option.description}`);
        }
        lines.push("");
    }

    lines.push(heading("  Notes:"));
    for (const note of HELP_NOTES) {
        lines.push(`    ${styleCommandExample(note, styler)}`);
    }
    lines.push("");

    lines.push(heading("  Examples:"));
    for (const example of HELP_EXAMPLES) {
        lines.push(`    ${styleCommandExample(example, styler)}`);
    }
    lines.push("  ");

    return lines.join("\n");
}

function printHelp(): string {
    return buildHelpText();
}

function renderHelpText(styler: Styler): string {
    return buildHelpText(styler);
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
        flag: (text) => apply("38;5;51", text), // Bright cyan for flags
        arg: (text) => apply("38;5;221", text), // Bright yellow for arguments
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

function resolveAuthenticatedLogin(): string | undefined {
    const response = runGh([
        "api",
        "user",
        "--jq",
        ".login",
    ]);

    if (response.status !== 0) {
        return undefined;
    }

    const login = response.stdout.trim();
    return login.length > 0 ? login : undefined;
}

function listReposForOwner(owner: string): string[] {
    const response = runGh([
        "repo",
        "list",
        owner,
        "--limit",
        "1000",
        "--json",
        "nameWithOwner",
    ]);

    if (response.status !== 0) {
        throw new Error(
            response.stderr || `failed to list repositories for ${owner}`
        );
    }

    const parsed: unknown = JSON.parse(response.stdout || "[]");
    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => (entry as { nameWithOwner?: string }).nameWithOwner)
        .filter(
            (name): name is string =>
                typeof name === "string" && name.length > 0
        );
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

type ListRunsProgressCallback = (
    fetchedInStatus: number,
    detail: string
) => void;

function listRunsViaGhRunList(
    repo: string,
    status: string,
    options: ParsedOptions,
    onProgress?: ListRunsProgressCallback
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

    const runs = parsed
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => entry as WorkflowRun);

    onProgress?.(runs.length, "legacy-list");
    return runs;
}

function listRuns(
    repo: string,
    status: string,
    options: ParsedOptions,
    onProgress?: ListRunsProgressCallback
): WorkflowRun[] {
    const workflowValue = options["workflow"];
    if (typeof workflowValue === "string" && workflowValue.length > 0) {
        return listRunsViaGhRunList(repo, status, options, onProgress);
    }

    const limit = Number.parseInt(String(options["limit"] ?? "500"), 10);
    const pageSize = 100;
    const allRuns: WorkflowRun[] = [];

    const queryMappings: Array<[keyof ParsedOptions, string]> = [
        ["branch", "branch"],
        ["event", "event"],
        ["user", "actor"],
        ["commit", "head_sha"],
        ["created", "created"],
    ];

    for (let page = 1; allRuns.length < limit; page += 1) {
        const remaining = limit - allRuns.length;
        const perPage = Math.min(pageSize, remaining);
        const args = [
            "api",
            "-X",
            "GET",
            `/repos/${repo}/actions/runs`,
            "-f",
            `status=${status}`,
            "-f",
            `per_page=${perPage}`,
            "-f",
            `page=${page}`,
        ];

        for (const [key, queryKey] of queryMappings) {
            const value = options[key];
            if (typeof value === "string" && value.length > 0) {
                args.push("-f", `${queryKey}=${value}`);
            }
        }

        const response = runGh(args);
        if (response.status !== 0) {
            throw new Error(
                response.stderr || `gh api run list failed for status ${status}`
            );
        }

        const parsed: unknown = JSON.parse(response.stdout || "{}");
        const workflowRuns =
            parsed &&
            typeof parsed === "object" &&
            Array.isArray(
                (parsed as { workflow_runs?: unknown[] }).workflow_runs
            )
                ? (parsed as { workflow_runs: unknown[] }).workflow_runs
                : [];

        const mappedRuns = workflowRuns
            .filter((entry) => entry && typeof entry === "object")
            .map((entry) => {
                const run = entry as {
                    id?: number;
                    status?: string;
                    conclusion?: string;
                    name?: string;
                    workflow_name?: string;
                    head_branch?: string;
                    event?: string;
                    created_at?: string;
                    display_title?: string;
                    html_url?: string;
                };

                return {
                    createdAt: run.created_at,
                    conclusion: run.conclusion,
                    databaseId: run.id ?? 0,
                    displayTitle: run.display_title,
                    event: run.event,
                    headBranch: run.head_branch,
                    status: run.status,
                    url: run.html_url,
                    workflowName: run.workflow_name ?? run.name,
                } as WorkflowRun;
            })
            .filter((run) => run.databaseId > 0);

        allRuns.push(...mappedRuns);
        onProgress?.(allRuns.length, `p=${page}`);

        if (mappedRuns.length < perPage) {
            break;
        }
    }

    return allRuns.slice(0, limit);
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
        const plainPrefix = `${title} [${bar}] ${progressText} ${percent}%`;
        const terminalWidth = process.stdout.columns;
        const suffixBudget =
            typeof terminalWidth === "number" && terminalWidth > 0
                ? Math.max(0, terminalWidth - plainPrefix.length - 1)
                : undefined;

        const suffixText =
            typeof suffixBudget === "number"
                ? suffixBudget <= 0
                    ? ""
                    : suffix.length <= suffixBudget
                      ? suffix
                      : `${suffix.slice(0, Math.max(0, suffixBudget - 1))}…`
                : suffix;

        const line = `${styler.info(title)} ${styler.muted("[")}${styler.ok(bar)}${styler.muted("]")} ${styler.strong(progressText)} ${styler.muted(`${percent}%`)}${suffixText.length > 0 ? ` ${styler.muted(suffixText)}` : ""}`;
        process.stdout.write(`\r\u001b[2K${line}`);
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
    const reposOption = collectStringListOption(options, "repos");
    const allReposMode = options["all-repos"] === true;
    const ownerOption =
        typeof options["owner"] === "string" &&
        options["owner"].trim().length > 0
            ? options["owner"].trim()
            : undefined;

    if (
        allReposMode &&
        (typeof repoOption === "string" || reposOption.length > 0)
    ) {
        return emitError(
            "--all-repos cannot be combined with --repo or --repos.",
            "validation_error",
            jsonOutput,
            styler
        );
    }

    const authResult = runGh(["auth", "status"]);
    if (authResult.status !== 0) {
        return emitError(
            "gh CLI is not authenticated. Run: gh auth login",
            "auth_error",
            jsonOutput,
            styler
        );
    }

    let targetRepos: string[] = [];

    if (allReposMode) {
        const owner = ownerOption ?? resolveAuthenticatedLogin();
        if (typeof owner !== "string" || owner.length === 0) {
            return emitError(
                "unable to resolve authenticated user for --all-repos. Pass --owner <login>.",
                "validation_error",
                jsonOutput,
                styler
            );
        }

        try {
            targetRepos = listReposForOwner(owner);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            return emitError(
                `failed to list repositories: ${message}`,
                "gh_cli_error",
                jsonOutput,
                styler
            );
        }

        if (targetRepos.length === 0) {
            return emitError(
                `no repositories found for ${owner}.`,
                "validation_error",
                jsonOutput,
                styler
            );
        }
    } else {
        if (typeof repoOption === "string" && repoOption.length > 0) {
            targetRepos.push(repoOption);
        }

        targetRepos.push(...reposOption);

        if (targetRepos.length === 0) {
            const resolvedRepo = resolveRepo(undefined);
            if (typeof resolvedRepo !== "string" || resolvedRepo.length === 0) {
                if (!jsonOutput) {
                    console.log(printHelp());
                }
                return emitError(
                    "unable to resolve repository. Provide --repo <owner/name> / --repos <owner/name,..> or run inside a GitHub repository.",
                    "validation_error",
                    jsonOutput,
                    styler
                );
            }

            targetRepos = [resolvedRepo];
        }
    }

    targetRepos = Array.from(new Set(targetRepos));

    const invalidRepoValues = targetRepos.filter(
        (repo) => !isValidRepoSlug(repo)
    );
    if (invalidRepoValues.length > 0) {
        return emitError(
            `invalid repository values: ${invalidRepoValues.join(", ")}. Use owner/name format.`,
            "validation_error",
            jsonOutput,
            styler
        );
    }

    options["limit"] = String(limit);
    const showProgress = shouldShowProgress(
        jsonOutput,
        quiet,
        verbose,
        noProgress,
        ciMode
    );
    const repoSummaries: RunSummary[] = [];

    for (const [repoIndex, resolvedRepo] of targetRepos.entries()) {
        if (!jsonOutput && !quiet && targetRepos.length > 1) {
            if (repoIndex > 0) {
                console.log("");
            }
            console.log(
                styler.heading(
                    `Repository ${repoIndex + 1}/${targetRepos.length}: ${resolvedRepo}`
                )
            );
        }

        const repoStartedAt = Date.now();
        const allRuns: WorkflowRun[] = [];
        const expectedFetchTotal = Math.max(1, statuses.length * limit);
        const fetchProgress = createProgressBar(
            "Fetching runs",
            expectedFetchTotal,
            styler,
            showProgress
        );

        try {
            for (const [index, status] of statuses.entries()) {
                const beforeCount = allRuns.length;
                const runs = listRuns(
                    resolvedRepo,
                    status,
                    options,
                    (fetchedInStatus, detail) => {
                        fetchProgress.update(
                            beforeCount + fetchedInStatus,
                            `s=${index + 1}/${statuses.length} ${status} ${detail} runs=${beforeCount + fetchedInStatus}`
                        );
                    }
                );
                allRuns.push(...runs);
                fetchProgress.update(
                    allRuns.length,
                    `s=${index + 1}/${statuses.length} ${status} done runs=${allRuns.length}`
                );
            }
            fetchProgress.done();
        } catch (error) {
            fetchProgress.done();
            const message =
                error instanceof Error ? error.message : String(error);
            return emitError(
                `failed to list runs for ${resolvedRepo}: ${message}`,
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

        if (!jsonOutput && !quiet) {
            console.log(
                styler.info(
                    `Planned deletions: ${candidates.length} (from ${allRuns.length} fetched runs, ${dedupedRuns.length} unique).`
                )
            );
        }

        const deleteProgress = createProgressBar(
            "Deleting runs",
            candidates.length,
            styler,
            showProgress && !dryRun
        );

        if (!dryRun) {
            for (const run of candidates) {
                attempted += 1;

                const result = deleteRunWithRetry(
                    resolvedRepo,
                    run.databaseId,
                    maxRetries,
                    retryDelayMs,
                    (attemptNumber, totalAttempts) => {
                        deleteProgress.update(
                            attempted - 1,
                            `id=${run.databaseId} a=${attemptNumber}/${totalAttempts} d=${deleted} f=${failedIds.length}`
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
                    `d=${deleted} f=${failedIds.length}`
                );
            }

            deleteProgress.done();
        }

        const summary: RunSummary = {
            attempted,
            deleted,
            dryRun,
            durationMs: Date.now() - repoStartedAt,
            failed: failedIds.length,
            failedIds,
            matched: runsToProcess.length,
            planned: candidates.length,
            repo: resolvedRepo,
            skippedByExclusion,
            statuses,
            skippedByAge,
        };

        repoSummaries.push(summary);

        if (!jsonOutput) {
            if (!quiet) {
                printTextSummary(summary, styler, unicodeTables);
                if (dryRun) {
                    printDryRunWorkflowSummary(
                        candidates,
                        styler,
                        unicodeTables
                    );
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
                console.log(
                    styler.ok("Dry run complete: no deletions performed.")
                );
            }
        }
    }

    if (jsonOutput) {
        if (repoSummaries.length === 1) {
            console.log(JSON.stringify(repoSummaries[0], null, 2));
        } else {
            const aggregate = {
                attempted: repoSummaries.reduce(
                    (accumulator, summary) => accumulator + summary.attempted,
                    0
                ),
                deleted: repoSummaries.reduce(
                    (accumulator, summary) => accumulator + summary.deleted,
                    0
                ),
                dryRun,
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
    }

    const hasFailures = repoSummaries.some((summary) => summary.failed > 0);
    return hasFailures ? 2 : 0;
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
