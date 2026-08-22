import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
    DeleteResult,
    GhResponse,
    ParsedOptions,
    WorkflowRun,
} from "../src/cli-types.ts";

import { main, runCli } from "../src/cli.ts";

const ghMocks = vi.hoisted(() => ({
    deleteRunWithRetry:
        vi.fn<
            (
                repo: string,
                runId: number,
                maxRetries: number,
                baseDelayMs: number,
                onAttempt?: (attempt: number, totalAttempts: number) => void
            ) => DeleteResult
        >(),
    listReposForOwner: vi.fn<(owner: string) => string[]>(),
    listRuns:
        vi.fn<
            (
                repo: string,
                status: string,
                options: Readonly<ParsedOptions>,
                onProgress?: (fetched: number, detail: string) => void
            ) => WorkflowRun[]
        >(),
    resolveAuthenticatedLogin: vi.fn<() => string | undefined>(),
    resolveRepo: vi.fn<(repo: string | undefined) => string | undefined>(),
    runGh: vi.fn<(arguments_: readonly string[]) => GhResponse>(),
}));

vi.mock(import("../src/cli-gh.ts"), () => ghMocks);

interface CapturedMainResult {
    readonly code: number;
    readonly errors: readonly string[];
    readonly logs: readonly string[];
}

const invalidArgumentCases = [
    {
        arguments: [
            "--all-repos",
            "--repo",
            "owner/repo",
            "--dry-run",
        ],
        name: "--all-repos combined with --repo",
    },
    {
        arguments: [
            "--before-days",
            "-1",
            "--dry-run",
        ],
        name: "an invalid before-days value",
    },
    {
        arguments: [
            "--color",
            "rainbow",
            "--dry-run",
        ],
        name: "an invalid color mode",
    },
    {
        arguments: [
            "--max-failures",
            "0",
            "--dry-run",
        ],
        name: "an invalid max-failures value",
    },
    {
        arguments: [
            "--max-retries",
            "-1",
            "--dry-run",
        ],
        name: "an invalid max-retries value",
    },
    {
        arguments: [
            "--order",
            "sideways",
            "--dry-run",
        ],
        name: "an invalid order",
    },
    {
        arguments: [
            "--repo",
            "invalid-repo",
            "--dry-run",
        ],
        name: "an invalid --repo format",
    },
    {
        arguments: [
            "--repo",
            "owner/repo",
            "--limit",
            "0",
        ],
        name: "an invalid limit",
    },
    {
        arguments: [
            "--repo",
            "owner/repo",
            "--status",
            "not-real-status",
        ],
        name: "an invalid status",
    },
    {
        arguments: [
            "--retry-delay-ms",
            "-1",
            "--dry-run",
        ],
        name: "an invalid retry-delay-ms value",
    },
    {
        arguments: [
            "--unicode",
            "emoji",
            "--dry-run",
        ],
        name: "an invalid Unicode mode",
    },
    {
        arguments: [],
        name: "missing confirmation",
    },
] as const;

function captureMain(argv: readonly string[]): CapturedMainResult {
    const logSpy = vi.spyOn(console, "log").mockReturnValue(undefined);
    const errorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);
    const code = main(argv);

    return {
        code,
        errors: errorSpy.mock.calls.map(([value]) => String(value)),
        logs: logSpy.mock.calls.map(([value]) => String(value)),
    };
}

function createRun(
    databaseId: number,
    overrides: Partial<WorkflowRun> = {}
): WorkflowRun {
    return {
        conclusion: "failure",
        createdAt: "2020-01-01T00:00:00Z",
        databaseId,
        displayTitle: `Run ${databaseId}`,
        event: "push",
        headBranch: "main",
        status: "completed",
        url: `https://example.test/${databaseId}`,
        workflowName: "CI",
        ...overrides,
    };
}

function withSilentConsole<T>(callback: () => T): T {
    const logSpy = vi.spyOn(console, "log").mockReturnValue(undefined);
    const errorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);

    try {
        return callback();
    } finally {
        logSpy.mockRestore();
        errorSpy.mockRestore();
    }
}

beforeEach(() => {
    ghMocks.deleteRunWithRetry.mockReset();
    ghMocks.deleteRunWithRetry.mockReturnValue({ attempts: 1, ok: true });
    ghMocks.listReposForOwner.mockReset();
    ghMocks.listReposForOwner.mockReturnValue(["owner/repo"]);
    ghMocks.listRuns.mockReset();
    ghMocks.listRuns.mockReturnValue([]);
    ghMocks.resolveAuthenticatedLogin.mockReset();
    ghMocks.resolveAuthenticatedLogin.mockReturnValue("owner");
    ghMocks.resolveRepo.mockReset();
    ghMocks.resolveRepo.mockReturnValue("owner/repo");
    ghMocks.runGh.mockReset();
    ghMocks.runGh.mockReturnValue({ status: 0, stderr: "", stdout: "" });
});

describe("main validation", () => {
    it.each(invalidArgumentCases)(
        "returns 1 for $name",
        ({ arguments: argv }) => {
            expect.assertions(1);

            const code = withSilentConsole(() => main([...argv]));

            expect(code).toBe(1);
        }
    );

    it("returns 0 for --help", () => {
        expect.assertions(2);

        const code = withSilentConsole(() => main(["--help"]));

        expect(code).toBe(0);
        expect(code).not.toBe(1);
    });

    it("runs the current process arguments through the executable wrapper", () => {
        expect.assertions(2);

        const originalArgv = process.argv;
        const originalExitCode = process.exitCode;
        const logSpy = vi.spyOn(console, "log").mockReturnValue(undefined);

        try {
            process.argv = [process.execPath, "gh-runs-cleanup", "--help"];
            runCli();

            expect(process.exitCode).toBe(0);
            expect(logSpy.mock.calls.join("\n")).toContain("gh-runs-cleanup");
        } finally {
            process.argv = originalArgv;
            process.exitCode = originalExitCode;
            logSpy.mockRestore();
        }
    });

    it("rejects invalid repositories before checking authentication", () => {
        expect.assertions(2);

        const result = captureMain([
            "--repo",
            "invalid",
            "--dry-run",
        ]);

        expect(result.code).toBe(1);
        expect(ghMocks.runGh).not.toHaveBeenCalled();
    });

    it("emits stable JSON validation errors", () => {
        expect.assertions(3);

        const result = captureMain([
            "--json",
            "--repo",
            "owner/repo",
            "--limit",
            "0",
            "--dry-run",
        ]);

        expect(result.code).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(JSON.parse(result.errors[0] ?? "{}")).toStrictEqual({
            error: {
                category: "validation_error",
                message: "--limit must be a positive integer.",
            },
        });
    });

    it("reports authentication failures", () => {
        expect.assertions(2);

        ghMocks.runGh.mockReturnValue({
            status: 1,
            stderr: "not logged in",
            stdout: "",
        });

        const result = captureMain([
            "--repo",
            "owner/repo",
            "--dry-run",
        ]);

        expect(result.code).toBe(1);
        expect(result.errors.join("\n")).toContain(
            "gh CLI is not authenticated"
        );
    });

    it("reports an unresolved current repository and prints help", () => {
        expect.assertions(3);

        ghMocks.resolveRepo.mockReturnValue(undefined);

        const result = captureMain(["--dry-run"]);

        expect(result.code).toBe(1);
        expect(result.logs.join("\n")).toContain("Usage:");
        expect(result.errors.join("\n")).toContain(
            "unable to resolve repository"
        );
    });

    it.each([
        {
            configure: () =>
                ghMocks.resolveAuthenticatedLogin.mockReturnValue(undefined),
            expected: "unable to resolve authenticated user",
            name: "missing owner",
        },
        {
            configure: () => ghMocks.listReposForOwner.mockReturnValue([]),
            expected: "no repositories found",
            name: "empty repository list",
        },
        {
            configure: () =>
                ghMocks.listReposForOwner.mockImplementation(() => {
                    throw new Error("API denied");
                }),
            expected: "failed to list repositories: API denied",
            name: "repository listing failure",
        },
    ])("reports $name in all-repositories mode", ({ configure, expected }) => {
        expect.assertions(2);

        configure();

        const result = captureMain(["--all-repos", "--dry-run"]);

        expect(result.code).toBe(1);
        expect(result.errors.join("\n")).toContain(expected);
    });
});

describe("main cleanup execution", () => {
    it("filters, deduplicates, orders, limits, and summarizes a JSON dry run", () => {
        expect.assertions(4);

        ghMocks.listRuns.mockImplementation(
            (_repo, status, _options, onProgress) => {
                onProgress?.(1, "page");
                return status === "failure"
                    ? [
                          createRun(1),
                          createRun(2, { workflowName: "Skip Me" }),
                          createRun(3, { createdAt: "2999-01-01T00:00:00Z" }),
                          createRun(6, { createdAt: undefined }),
                      ]
                    : [
                          createRun(1),
                          createRun(4, { headBranch: "old" }),
                          createRun(5),
                      ];
            }
        );

        const result = captureMain([
            "--repo=owner/repo",
            "--dry-run",
            "--json",
            "--status=failure",
            "--status",
            "cancelled",
            "--exclude-workflow=skip me",
            "--exclude-branch",
            "old",
            "--before-days=1",
            "--max-delete=2",
            "--order=newest",
            "--limit=10",
            "--color=always",
            "--unicode=always",
        ]);
        const summary: unknown = JSON.parse(result.logs.at(-1) ?? "{}");

        expect(result.code).toBe(0);
        expect(summary).toMatchObject({
            matched: 2,
            planned: 2,
            repo: "owner/repo",
            skippedByAge: 2,
            skippedByExclusion: 2,
            statuses: ["failure", "cancelled"],
        });
        expect(ghMocks.deleteRunWithRetry).not.toHaveBeenCalled();
        expect(ghMocks.listRuns).toHaveBeenCalledTimes(2);
    });

    it("deletes candidates and returns 2 when a deletion fails", () => {
        expect.assertions(8);

        ghMocks.listRuns.mockReturnValue([
            createRun(11),
            createRun(12),
            createRun(13),
        ]);
        ghMocks.deleteRunWithRetry
            .mockReturnValueOnce({ attempts: 1, ok: true })
            .mockReturnValueOnce({
                attempts: 3,
                error: "API denied",
                ok: false,
            });

        const result = captureMain([
            "--repo",
            "owner/repo",
            "--confirm",
            "--max-failures",
            "1",
            "--verbose",
            "--no-progress",
        ]);

        expect(result.code).toBe(2);
        expect(ghMocks.deleteRunWithRetry).toHaveBeenCalledTimes(2);
        expect(result.errors.join("\n")).toContain("Delete failed for run 12");
        expect(result.logs.join("\n")).toContain("Planned deletions: 3");
        expect(result.logs.join("\n")).toContain("Attempted deletions");
        expect(result.logs.join("\n")).toContain("Failed IDs");
        expect(result.logs.join("\n")).toContain("Run details");
        expect(result.logs.join("\n")).not.toContain("Dry run complete");
    });

    it("stops on the first failure in fail-fast mode", () => {
        expect.assertions(3);

        ghMocks.listRuns.mockReturnValue([createRun(21), createRun(22)]);
        ghMocks.deleteRunWithRetry.mockReturnValue({
            attempts: 1,
            error: "failed",
            ok: false,
        });

        const result = captureMain([
            "--repo",
            "owner/repo",
            "--yes",
            "--fail-fast",
            "--quiet",
        ]);

        expect(result.code).toBe(2);
        expect(ghMocks.deleteRunWithRetry).toHaveBeenCalledTimes(1);
        expect(result.logs).toStrictEqual([]);
    });

    it("prints summary details and the dry-run completion notice", () => {
        expect.assertions(5);

        ghMocks.listRuns.mockReturnValue([
            createRun(31),
            createRun(32, { conclusion: undefined, headBranch: undefined }),
        ]);

        const result = captureMain([
            "--repo",
            "owner/repo",
            "--dry-run",
            "--summary",
            "--max-delete",
            "1",
            "--all-statuses",
            "--no-color",
            "--no-unicode",
        ]);

        expect(result.code).toBe(0);
        expect(result.logs.join("\n")).toContain("Summary details");
        expect(result.logs.join("\n")).toContain("Limited by --max-delete");
        expect(result.logs.join("\n")).toContain("Dry run complete");
        expect(ghMocks.listRuns).toHaveBeenCalledTimes(15);
    });

    it("emits aggregate JSON for multiple repositories", () => {
        expect.assertions(4);

        ghMocks.listReposForOwner.mockReturnValue(["owner/one", "owner/two"]);
        ghMocks.listRuns.mockReturnValue([]);

        const result = captureMain([
            "--all-repos",
            "--owner=owner",
            "--dry-run",
            "--json",
        ]);
        const output: unknown = JSON.parse(result.logs.at(-1) ?? "{}");

        expect(result.code).toBe(0);
        expect(output).toMatchObject({
            aggregate: { dryRun: true, failed: 0, repoCount: 2 },
            repos: [
                expect.objectContaining({ repo: "owner/one" }),
                expect.objectContaining({ repo: "owner/two" }),
            ],
        });
        expect(ghMocks.listReposForOwner).toHaveBeenCalledWith("owner");
        expect(ghMocks.listRuns).toHaveBeenCalledTimes(4);
    });

    it("prints headings between multiple non-JSON repositories", () => {
        expect.assertions(3);

        ghMocks.listReposForOwner.mockReturnValue(["owner/one", "owner/two"]);

        const result = captureMain(["--all-repos", "--dry-run"]);

        expect(result.code).toBe(0);
        expect(result.logs.join("\n")).toContain("Repository 1/2");
        expect(result.logs.join("\n")).toContain("Repository 2/2");
    });

    it("reports workflow-run listing failures", () => {
        expect.assertions(3);

        ghMocks.listRuns.mockImplementation(() => {
            throw new Error("runs denied");
        });

        const result = captureMain([
            "--repo",
            "owner/repo",
            "--dry-run",
            "--json",
        ]);

        expect(result.code).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain("failed to list runs");
    });
});
