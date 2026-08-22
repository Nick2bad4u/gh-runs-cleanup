import { spawnSync } from "node:child_process";

import type {
    DeleteResult,
    GhResponse,
    ParsedOptions,
    WorkflowRun,
} from "./cli-types.ts";

type ListRunsProgressCallback = (
    fetchedInStatus: number,
    detail: string
) => void;

/** Delete one workflow run, retrying transient GitHub API failures. */
export function deleteRunWithRetry(
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

/**
 * List repositories visible to the authenticated user for an owner.
 *
 * @throws {@link Error} When the GitHub CLI request fails or returns malformed
 *   JSON.
 */
export function listReposForOwner(owner: string): string[] {
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
    if (!isUnknownArray(parsed)) {
        return [];
    }

    return parsed
        .filter(isRecord)
        .map((entry) => entry["nameWithOwner"])
        .filter(
            (name): name is string =>
                typeof name === "string" && name.length > 0
        );
}

/**
 * List workflow runs for one status using the API or compatibility mode.
 *
 * @throws {@link Error} When the GitHub CLI request fails or returns malformed
 *   JSON.
 */
export function listRuns(
    repo: string,
    status: string,
    options: Readonly<ParsedOptions>,
    onProgress?: ListRunsProgressCallback
): WorkflowRun[] {
    const workflowValue = options["workflow"];
    if (typeof workflowValue === "string" && workflowValue.length > 0) {
        return listRunsViaGhRunList(repo, status, options, onProgress);
    }

    const limit = Math.trunc(Number(options["limit"] ?? 500));
    const pageSize = 100;
    const allRuns: WorkflowRun[] = [];

    const queryMappings: [keyof ParsedOptions, string][] = [
        ["branch", "branch"],
        ["event", "event"],
        ["user", "actor"],
        ["commit", "head_sha"],
        ["created", "created"],
    ];

    let page = 1;
    while (allRuns.length < limit) {
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
            isRecord(parsed) && isUnknownArray(parsed["workflow_runs"])
                ? parsed["workflow_runs"]
                : [];

        const mappedRuns = workflowRuns
            .map((workflowRun) => toApiWorkflowRun(workflowRun))
            .filter(isDefined);

        allRuns.push(...mappedRuns);
        onProgress?.(allRuns.length, `p=${page}`);

        if (mappedRuns.length < perPage) {
            break;
        }

        page += 1;
    }

    return allRuns.slice(0, limit);
}

/** Resolve the login associated with the active GitHub CLI authentication. */
export function resolveAuthenticatedLogin(): string | undefined {
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

/** Resolve an explicit repository or infer one from the current directory. */
export function resolveRepo(
    optionRepo: string | undefined
): string | undefined {
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

/** Invoke the authenticated GitHub CLI and capture its result. */
export function runGh(args: readonly string[]): GhResponse {
    const result = spawnSync("gh", [...args], {
        encoding: "utf8",
        stdio: "pipe",
    });

    return {
        status: result.status ?? 1,
        stderr: typeof result.stderr === "string" ? result.stderr : "",
        stdout: typeof result.stdout === "string" ? result.stdout : "",
    };
}

function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

function isPositiveRunId(value: unknown): value is number {
    return (
        typeof value === "number" && Number.isSafeInteger(value) && value > 0
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isRetryableDeleteError(stderr: string): boolean {
    const retryPattern =
        /502|503|504|connection reset|internal server error|rate limit|temporar|timed out|timeout|unavailable/iv;
    return retryPattern.test(stderr);
}

function isUnknownArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

function listRunsViaGhRunList(
    repo: string,
    status: string,
    options: Readonly<ParsedOptions>,
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

    const mappings: [keyof ParsedOptions, string][] = [
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
    if (!isUnknownArray(parsed)) {
        return [];
    }

    const runs = parsed
        .map((workflowRun) => toGhWorkflowRun(workflowRun))
        .filter(isDefined);

    onProgress?.(runs.length, "legacy-list");
    return runs;
}

function readString(
    value: Readonly<Record<string, unknown>>,
    key: string
): string | undefined {
    const candidate = value[key];
    return typeof candidate === "string" ? candidate : undefined;
}

function toApiWorkflowRun(value: unknown): undefined | WorkflowRun {
    if (!isRecord(value) || !isPositiveRunId(value["id"])) {
        return undefined;
    }

    const workflowName =
        typeof value["workflow_name"] === "string"
            ? value["workflow_name"]
            : value["name"];

    return {
        conclusion: readString(value, "conclusion"),
        createdAt: readString(value, "created_at"),
        databaseId: value["id"],
        displayTitle: readString(value, "display_title"),
        event: readString(value, "event"),
        headBranch: readString(value, "head_branch"),
        status: readString(value, "status"),
        url: readString(value, "html_url"),
        workflowName:
            typeof workflowName === "string" ? workflowName : undefined,
    };
}

function toGhWorkflowRun(value: unknown): undefined | WorkflowRun {
    if (!isRecord(value) || !isPositiveRunId(value["databaseId"])) {
        return undefined;
    }

    return {
        conclusion: readString(value, "conclusion"),
        createdAt: readString(value, "createdAt"),
        databaseId: value["databaseId"],
        displayTitle: readString(value, "displayTitle"),
        event: readString(value, "event"),
        headBranch: readString(value, "headBranch"),
        status: readString(value, "status"),
        url: readString(value, "url"),
        workflowName: readString(value, "workflowName"),
    };
}

function waitMs(milliseconds: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}
