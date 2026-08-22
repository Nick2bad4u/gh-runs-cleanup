import { afterEach, describe, expect, it, vi } from "vitest";

import type { RunSummary, WorkflowRun } from "../src/cli-types.ts";

import {
    getCreatedAtEpoch,
    printDryRunWorkflowSummary,
    printSummaryDetails,
    printTextSummary,
    printVerboseRuns,
    sortRuns,
} from "../src/cli-output.ts";
import { createStyler } from "../src/cli-styling.ts";

const styler = createStyler(false);

afterEach(() => {
    vi.restoreAllMocks();
});

function captureLogs(callback: () => void): string {
    const logSpy = vi.spyOn(console, "log").mockReturnValue(undefined);
    callback();
    return logSpy.mock.calls.map(([value]) => String(value)).join("\n");
}

function createRun(
    databaseId: number,
    overrides: Partial<WorkflowRun> = {}
): WorkflowRun {
    return {
        conclusion: "failure",
        createdAt: "2026-08-20T12:00:00Z",
        databaseId,
        displayTitle: `Run ${databaseId}`,
        event: "push",
        headBranch: "main",
        status: "completed",
        url: `https://example.test/runs/${databaseId}`,
        workflowName: "CI",
        ...overrides,
    };
}

describe("getCreatedAtEpoch and sortRuns", () => {
    it("parses valid dates and returns NaN for missing dates", () => {
        expect.assertions(2);

        const validDateEpoch = getCreatedAtEpoch(createRun(1));
        const missingDateEpoch = getCreatedAtEpoch(
            createRun(2, { createdAt: undefined })
        );

        expect(validDateEpoch).toBe(1_787_227_200_000);
        expect(Number.isNaN(missingDateEpoch)).toBe(true);
    });

    it("sorts oldest and newest without mutating the input", () => {
        expect.assertions(3);

        const runs = [
            createRun(2, { createdAt: "2026-08-21T00:00:00Z" }),
            createRun(1, { createdAt: "2026-08-20T00:00:00Z" }),
        ];

        expect(
            sortRuns(runs, "oldest").map((run) => run.databaseId)
        ).toStrictEqual([1, 2]);
        expect(
            sortRuns(runs, "newest").map((run) => run.databaseId)
        ).toStrictEqual([2, 1]);
        expect(runs.map((run) => run.databaseId)).toStrictEqual([2, 1]);
    });

    it("keeps input order for none and sorts invalid dates last by ID", () => {
        expect.assertions(3);

        const invalidTwo = createRun(2, { createdAt: "invalid" });
        const invalidOne = createRun(1, { createdAt: undefined });
        const valid = createRun(3);
        const runs = [
            invalidTwo,
            valid,
            invalidOne,
        ];

        expect(sortRuns(runs, "none")).toStrictEqual(runs);
        expect(
            sortRuns(runs, "oldest").map((run) => run.databaseId)
        ).toStrictEqual([
            3,
            1,
            2,
        ]);
        expect(sortRuns([invalidTwo, invalidOne], "newest")).toStrictEqual([
            invalidOne,
            invalidTwo,
        ]);
    });
});

describe("human-readable summaries", () => {
    it("prints empty and grouped dry-run workflow summaries", () => {
        expect.assertions(4);

        const emptyOutput = captureLogs(() => {
            printDryRunWorkflowSummary([], styler, false);
        });
        const groupedOutput = captureLogs(() => {
            printDryRunWorkflowSummary(
                [
                    createRun(1),
                    createRun(2),
                    createRun(3, { workflowName: undefined }),
                ],
                styler,
                true
            );
        });

        expect(emptyOutput).toContain("No workflow runs matched");
        expect(groupedOutput).toContain("CI");
        expect(groupedOutput).toContain("(unknown workflow)");
        expect(groupedOutput).toContain("┌");
    });

    it("prints status, branch, and max-delete details", () => {
        expect.assertions(5);

        const runs = [
            createRun(1),
            createRun(2, {
                conclusion: undefined,
                headBranch: undefined,
                status: undefined,
            }),
        ];
        const output = captureLogs(() => {
            printSummaryDetails(runs, runs.slice(0, 1), styler, false);
        });

        expect(output).toContain("By status");
        expect(output).toContain("completed/failure");
        expect(output).toContain("unknown");
        expect(output).toContain("(no branch)");
        expect(output).toContain("Limited by --max-delete");
    });

    it("prints deletion results and failed IDs for an actual run", () => {
        expect.assertions(5);

        const summary: RunSummary = {
            attempted: 2,
            deleted: 1,
            dryRun: false,
            durationMs: 10,
            failed: 1,
            failedIds: [22],
            matched: 3,
            planned: 2,
            repo: "owner/repo",
            skippedByAge: 1,
            skippedByExclusion: 2,
            statuses: ["failure"],
        };
        const output = captureLogs(() => {
            printTextSummary(summary, styler, false);
        });

        expect(output).toContain("Cleanup summary");
        expect(output).toContain("Deletion results");
        expect(output).toContain("Attempted deletions");
        expect(output).toContain("Failed IDs (first 50): 22");
        expect(output).not.toContain("Dry run complete");
    });

    it("omits deletion results for a dry run", () => {
        expect.assertions(2);

        const output = captureLogs(() => {
            printTextSummary(
                {
                    attempted: 0,
                    deleted: 0,
                    dryRun: true,
                    durationMs: 1,
                    failed: 0,
                    failedIds: [],
                    matched: 0,
                    planned: 0,
                    repo: "owner/repo",
                    skippedByAge: 0,
                    skippedByExclusion: 0,
                    statuses: ["failure"],
                },
                styler,
                true
            );
        });

        expect(output).toContain("Cleanup summary");
        expect(output).not.toContain("Deletion results");
    });

    it("prints at most 50 verbose runs and reports the remainder", () => {
        expect.assertions(4);

        const runs = Array.from({ length: 52 }, (_, index) =>
            createRun(index + 1, {
                conclusion: undefined,
                headBranch: undefined,
                workflowName: undefined,
            })
        );
        const output = captureLogs(() => {
            printVerboseRuns(runs, styler, false);
        });

        expect(output).toContain("Run details (first 50)");
        expect(output).toContain("(unknown workflow)");
        expect(output).toContain("(no branch)");
        expect(output).toContain("... and 2 more");
    });
});
