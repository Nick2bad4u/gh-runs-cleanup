/** Controls whether ANSI color sequences are emitted. */
export type ColorMode =
    | "always"
    | "auto"
    | "never";

/** Result of deleting one workflow run, including retry attempts. */
export interface DeleteResult {
    readonly attempts: number;
    readonly error?: string;
    readonly ok: boolean;
}

/** Stable machine-readable category for a CLI failure. */
export type ErrorCategory =
    | "auth_error"
    | "gh_cli_error"
    | "runtime_error"
    | "validation_error";
/** Captured result from invoking the GitHub CLI. */
export interface GhResponse {
    readonly status: number;
    readonly stderr: string;
    readonly stdout: string;
}

/** Parsed command-line flags keyed by their long option names. */
export type ParsedOptions = Record<
    string,
    | boolean
    | readonly string[]
    | string
>;

/** Summary produced for a single repository cleanup operation. */
export interface RunSummary {
    readonly attempted: number;
    readonly deleted: number;
    readonly dryRun: boolean;
    readonly durationMs: number;
    readonly failed: number;
    readonly failedIds: readonly number[];
    readonly matched: number;
    readonly planned: number;
    readonly repo: string;
    readonly skippedByAge: number;
    readonly skippedByExclusion: number;
    readonly statuses: readonly string[];
}

/** Formatting functions used by human-readable CLI output. */
export interface Styler {
    readonly arg: (text: string) => string;
    readonly count: (value: number) => string;
    readonly error: (text: string) => string;
    readonly flag: (text: string) => string;
    readonly heading: (text: string) => string;
    readonly info: (text: string) => string;
    readonly muted: (text: string) => string;
    readonly ok: (text: string) => string;
    readonly status: (text: string) => string;
    readonly strong: (text: string) => string;
    readonly warn: (text: string) => string;
}

/** Controls whether Unicode table glyphs are emitted. */
export type UnicodeMode =
    | "always"
    | "auto"
    | "never";

/** Workflow-run fields returned by the GitHub CLI JSON query. */
export interface WorkflowRun {
    readonly conclusion: string | undefined;
    readonly createdAt: string | undefined;
    readonly databaseId: number;
    readonly displayTitle: string | undefined;
    readonly event: string | undefined;
    readonly headBranch: string | undefined;
    readonly status: string | undefined;
    readonly url: string | undefined;
    readonly workflowName: string | undefined;
}

/** GitHub Actions workflow-run statuses accepted by the CLI. */
export const VALID_STATUSES: ReadonlySet<string> = new Set([
    "action_required",
    "cancelled",
    "completed",
    "failure",
    "in_progress",
    "neutral",
    "pending",
    "queued",
    "requested",
    "skipped",
    "stale",
    "startup_failure",
    "success",
    "timed_out",
    "waiting",
]);
