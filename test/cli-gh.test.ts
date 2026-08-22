import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GhResponse } from "../src/cli-types.ts";

import {
    deleteRunWithRetry,
    listReposForOwner,
    listRuns,
    resolveAuthenticatedLogin,
    resolveGhExecutablePath,
    resolveRepo,
    runGh,
} from "../src/cli-gh.ts";

const FIRST_TRUSTED_GH_PATH: Readonly<Record<string, string>> = {
    darwin: "/opt/homebrew/bin/gh",
    freebsd: "/usr/local/bin/gh",
    linux: "/usr/bin/gh",
    openbsd: "/usr/local/bin/gh",
    win32: String.raw`C:\Program Files\GitHub CLI\gh.exe`,
};

const existsSyncMock = vi.hoisted(() => vi.fn<(path: string) => boolean>());
const spawnSyncMock = vi.hoisted(() =>
    vi.fn<
        (
            command: string,
            arguments_: readonly string[],
            options: Readonly<Record<string, unknown>>
        ) => {
            readonly status: null | number;
            readonly stderr: null | string;
            readonly stdout: null | string;
        }
    >()
);

vi.mock("node:child_process", () => ({ spawnSync: spawnSyncMock }));
vi.mock("node:fs", () => ({ existsSync: existsSyncMock }));

function respond(response: Partial<GhResponse> = {}): void {
    spawnSyncMock.mockReturnValueOnce({
        status: response.status ?? 0,
        stderr: response.stderr ?? "",
        stdout: response.stdout ?? "",
    });
}

beforeEach(() => {
    existsSyncMock.mockReset();
    existsSyncMock.mockReturnValue(true);
    spawnSyncMock.mockReset();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe(runGh, () => {
    it("invokes gh with captured UTF-8 output", () => {
        expect.assertions(4);

        respond({ stdout: "ok" });

        const result = runGh(["auth", "status"]);
        const executablePath = FIRST_TRUSTED_GH_PATH[process.platform];

        expect(spawnSyncMock).toHaveBeenCalledWith(
            executablePath,
            ["auth", "status"],
            {
                encoding: "utf8",
                stdio: "pipe",
            }
        );
        expect(result.status).toBe(0);
        expect(result.stdout).toBe("ok");
        expect(result.stderr).toBe("");
    });

    it("normalizes missing native process results", () => {
        expect.assertions(1);

        spawnSyncMock.mockReturnValueOnce({
            status: null,
            stderr: null,
            stdout: null,
        });

        expect(runGh([])).toStrictEqual({ status: 1, stderr: "", stdout: "" });
    });

    it("returns a useful error when gh has no trusted executable path", () => {
        expect.assertions(2);

        existsSyncMock.mockReturnValue(false);

        expect(runGh([])).toStrictEqual({
            status: 1,
            stderr: "Unable to locate the GitHub CLI in a trusted system location. Set GH_PATH to its absolute executable path.",
            stdout: "",
        });
        expect(spawnSyncMock).not.toHaveBeenCalled();
    });
});

describe(resolveGhExecutablePath, () => {
    it("prefers an existing absolute GH_PATH override", () => {
        expect.assertions(2);

        const doesFileExist = vi.fn<(path: string) => boolean>(
            (path) => path === "/custom/bin/gh"
        );

        expect(
            resolveGhExecutablePath("linux", "/custom/bin/gh", doesFileExist)
        ).toBe("/custom/bin/gh");
        expect(doesFileExist).toHaveBeenCalledExactlyOnceWith("/custom/bin/gh");
    });

    it("rejects relative overrides and selects a fixed system path", () => {
        expect.assertions(2);

        const doesFileExist = vi.fn<(path: string) => boolean>(
            (path) => path === "/usr/local/bin/gh"
        );

        expect(
            resolveGhExecutablePath("linux", "relative/gh", doesFileExist)
        ).toBe("/usr/local/bin/gh");
        expect(doesFileExist.mock.calls).toStrictEqual([
            ["/usr/bin/gh"],
            ["/usr/local/bin/gh"],
        ]);
    });

    it("returns undefined when the platform has no trusted installation", () => {
        expect.assertions(1);

        expect(
            resolveGhExecutablePath("aix", undefined, () => false)
        ).toBeUndefined();
    });
});

describe("repository resolution", () => {
    it("lists and filters repositories", () => {
        expect.assertions(2);

        respond({
            stdout: JSON.stringify([
                { nameWithOwner: "owner/one" },
                { nameWithOwner: "" },
                { different: true },
                null,
                { nameWithOwner: "owner/two" },
            ]),
        });

        expect(listReposForOwner("owner")).toStrictEqual([
            "owner/one",
            "owner/two",
        ]);
        expect(spawnSyncMock).toHaveBeenCalledTimes(1);
    });

    it("returns no repositories for a non-array payload", () => {
        expect.assertions(1);

        respond({ stdout: "{}" });

        expect(listReposForOwner("owner")).toStrictEqual([]);
    });

    it("throws a useful repository-list error", () => {
        expect.assertions(1);

        respond({ status: 1, stderr: "permission denied" });

        expect(() => listReposForOwner("owner")).toThrow("permission denied");
    });

    it("resolves authenticated logins and failures", () => {
        expect.assertions(1);

        respond({ stdout: "nick\n" });
        respond({ status: 1 });
        respond({ stdout: " ".repeat(3) });

        expect([
            resolveAuthenticatedLogin(),
            resolveAuthenticatedLogin(),
            resolveAuthenticatedLogin(),
        ]).toStrictEqual([
            "nick",
            undefined,
            undefined,
        ]);
    });

    it("returns an explicit repository without invoking gh", () => {
        expect.assertions(2);
        expect(resolveRepo("owner/repo")).toBe("owner/repo");
        expect(spawnSyncMock).not.toHaveBeenCalled();
    });

    it("infers repositories and returns undefined on failures or blank output", () => {
        expect.assertions(1);

        respond({ stdout: "owner/repo\n" });
        respond({ status: 1 });
        respond({ stdout: "" });

        expect([
            resolveRepo(undefined),
            resolveRepo(undefined),
            resolveRepo(undefined),
        ]).toStrictEqual([
            "owner/repo",
            undefined,
            undefined,
        ]);
    });
});

describe(listRuns, () => {
    it("maps API runs, query filters, progress, and an exact limit", () => {
        expect.assertions(8);

        const onProgress = vi.fn<(fetched: number, detail: string) => void>();
        respond({
            stdout: JSON.stringify({
                workflow_runs: [
                    {
                        conclusion: "failure",
                        created_at: "2026-08-20T00:00:00Z",
                        display_title: "Build",
                        event: "push",
                        head_branch: "main",
                        html_url: "https://example.test/1",
                        id: 1,
                        status: "completed",
                        workflow_name: "CI",
                    },
                    {
                        id: 2,
                        name: "Fallback workflow name",
                    },
                ],
            }),
        });

        const result = listRuns(
            "owner/repo",
            "failure",
            {
                branch: "main",
                commit: "abc",
                created: ">2026-01-01",
                event: "push",
                limit: "2",
                user: "nick",
            },
            onProgress
        );

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ databaseId: 1, workflowName: "CI" });
        expect(result[1]).toMatchObject({
            databaseId: 2,
            workflowName: "Fallback workflow name",
        });

        const invokedArguments = spawnSyncMock.mock.calls[0]?.[1] ?? [];

        expect(invokedArguments).toContain("branch=main");
        expect(invokedArguments).toContain("actor=nick");
        expect(invokedArguments).toContain("head_sha=abc");
        expect(invokedArguments).toContain("created=>2026-01-01");
        expect(onProgress).toHaveBeenCalledWith(2, "p=1");
    });

    it("filters malformed API runs and stops on a partial page", () => {
        expect.assertions(2);

        respond({
            stdout: JSON.stringify({
                workflow_runs: [
                    { id: -1 },
                    { id: "wrong" },
                    { id: 3 },
                ],
            }),
        });

        expect(
            listRuns("owner/repo", "failure", { limit: "100" })
        ).toStrictEqual([expect.objectContaining({ databaseId: 3 })]);
        expect(spawnSyncMock).toHaveBeenCalledTimes(1);
    });

    it("returns no API runs for malformed response shapes", () => {
        expect.assertions(1);

        respond({ stdout: "[]" });
        respond({ stdout: "{}" });

        expect([
            listRuns("owner/repo", "failure", { limit: "1" }),
            listRuns("owner/repo", "failure", { limit: "1" }),
        ]).toStrictEqual([[], []]);
    });

    it("throws API errors with stderr or a fallback message", () => {
        expect.assertions(2);

        respond({ status: 1, stderr: "API denied" });
        respond({ status: 1 });

        expect(() => listRuns("owner/repo", "failure", { limit: "1" })).toThrow(
            "API denied"
        );
        expect(() => listRuns("owner/repo", "failure", { limit: "1" })).toThrow(
            "gh api run list failed"
        );
    });

    it("uses compatibility mode for workflow filters", () => {
        expect.assertions(6);

        const onProgress = vi.fn<(fetched: number, detail: string) => void>();
        respond({
            stdout: JSON.stringify([
                {
                    conclusion: "failure",
                    createdAt: "2026-08-20T00:00:00Z",
                    databaseId: 10,
                    displayTitle: "Build",
                    event: "push",
                    headBranch: "main",
                    status: "completed",
                    url: "https://example.test/10",
                    workflowName: "CI",
                },
                { databaseId: 0 },
            ]),
        });

        const result = listRuns(
            "owner/repo",
            "failure",
            {
                branch: "main",
                commit: "abc",
                created: ">2026-01-01",
                event: "push",
                limit: "20",
                user: "nick",
                workflow: "CI",
            },
            onProgress
        );

        expect(result).toStrictEqual([
            expect.objectContaining({ databaseId: 10 }),
        ]);

        const invokedArguments = spawnSyncMock.mock.calls[0]?.[1] ?? [];

        expect(invokedArguments.slice(0, 2)).toStrictEqual(["run", "list"]);
        expect(invokedArguments).toContain("--branch");
        expect(invokedArguments).toContain("--commit");
        expect(invokedArguments).toContain("--created");
        expect(onProgress).toHaveBeenCalledWith(1, "legacy-list");
    });

    it("handles malformed compatibility payloads and errors", () => {
        expect.assertions(3);

        respond({ stdout: "{}" });
        respond({ status: 1, stderr: "legacy denied" });
        respond({ status: 1 });

        expect(
            listRuns("owner/repo", "failure", { workflow: "CI" })
        ).toStrictEqual([]);
        expect(() =>
            listRuns("owner/repo", "failure", { workflow: "CI" })
        ).toThrow("legacy denied");
        expect(() =>
            listRuns("owner/repo", "failure", { workflow: "CI" })
        ).toThrow("gh run list failed");
    });
});

describe(deleteRunWithRetry, () => {
    it("returns after a successful first attempt", () => {
        expect.assertions(3);

        const onAttempt =
            vi.fn<(attempt: number, totalAttempts: number) => void>();
        respond();

        expect(
            deleteRunWithRetry("owner/repo", 12, 2, 0, onAttempt)
        ).toStrictEqual({ attempts: 1, ok: true });
        expect(onAttempt).toHaveBeenCalledWith(1, 3);
        expect(spawnSyncMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry a permanent error", () => {
        expect.assertions(2);

        respond({ status: 1, stderr: "not found" });

        expect(deleteRunWithRetry("owner/repo", 12, 3, 0)).toStrictEqual({
            attempts: 1,
            error: "not found",
            ok: false,
        });
        expect(spawnSyncMock).toHaveBeenCalledTimes(1);
    });

    it("retries transient errors and succeeds", () => {
        expect.assertions(2);

        respond({ status: 1, stderr: "503 unavailable" });
        respond();

        expect(deleteRunWithRetry("owner/repo", 12, 2, 0)).toStrictEqual({
            attempts: 2,
            ok: true,
        });
        expect(spawnSyncMock).toHaveBeenCalledTimes(2);
    });

    it("reports the final transient error after exhausting retries", () => {
        expect.assertions(2);

        respond({ status: 1, stderr: "rate limit" });
        respond({ status: 1, stderr: "timeout" });

        expect(deleteRunWithRetry("owner/repo", 12, 1, 0)).toStrictEqual({
            attempts: 2,
            error: "timeout",
            ok: false,
        });
        expect(spawnSyncMock).toHaveBeenCalledTimes(2);
    });
});
