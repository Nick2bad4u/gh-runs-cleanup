import type { RunSummary, Styler, WorkflowRun } from "./cli-types.ts";

import { formatTable } from "./cli-styling.ts";

/** Parse a GitHub workflow run's ISO creation time for chronological sorting. */
export function getCreatedAtEpoch(run: WorkflowRun): number {
    if (typeof run.createdAt !== "string" || run.createdAt.length === 0) {
        return NaN;
    }

    return Date.parse(run.createdAt);
}

/** Print the number of planned deletions grouped by workflow. */
export function printDryRunWorkflowSummary(
    runs: readonly WorkflowRun[],
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

    const headers = [
        styler.strong("Workflow"),
        styler.strong("Planned deletions"),
    ];
    const rows = counts.map(([workflow, count]) => [
        workflow,
        styler.count(count),
    ]);
    console.log(formatTable(headers, rows, useUnicode));
}

/** Print status and branch breakdowns for the selected runs. */
export function printSummaryDetails(
    runsToProcess: readonly WorkflowRun[],
    candidates: readonly WorkflowRun[],
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
    const statusHeaders = [styler.strong("Status"), styler.strong("Count")];
    const statusRows = statusCounts.map(([status, count]) => [
        styler.status(status),
        styler.count(count),
    ]);
    console.log(formatTable(statusHeaders, statusRows, useUnicode));

    console.log("");
    console.log(styler.info("Top branches"));
    const branchHeaders = [styler.strong("Branch"), styler.strong("Count")];
    const branchRows = branchCounts.map(([branch, count]) => [
        branch,
        styler.count(count),
    ]);
    console.log(formatTable(branchHeaders, branchRows, useUnicode));

    if (candidates.length < runsToProcess.length) {
        console.log(
            styler.warn(
                `Limited by --max-delete: ${candidates.length} of ${runsToProcess.length} matched runs are planned.`
            )
        );
    }
}

/** Print the primary cleanup summary and deletion results. */
export function printTextSummary(
    summary: RunSummary,
    styler: Styler,
    useUnicode: boolean
): void {
    const styledStatuses = summary.statuses.map((status) =>
        styler.status(status)
    );

    const summaryHeaders = [styler.strong("Metric"), styler.strong("Value")];
    const summaryRows = [
        [styler.info("Repository"), styler.strong(summary.repo)],
        [styler.info("Statuses"), styledStatuses.join(styler.muted(", "))],
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
    ];

    console.log(styler.heading("Cleanup summary"));
    console.log(formatTable(summaryHeaders, summaryRows, useUnicode));

    if (!summary.dryRun) {
        console.log("");
        console.log(styler.info("Deletion results"));
        const deletionHeaders = [
            styler.strong("Metric"),
            styler.strong("Value"),
        ];
        const deletionRows = [
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
        ];
        console.log(formatTable(deletionHeaders, deletionRows, useUnicode));

        if (summary.failedIds.length > 0) {
            console.log(
                `Failed IDs (first 50): ${summary.failedIds.slice(0, 50).join(", ")}`
            );
        }
    }
}

/** Print at most 50 matching runs with their most useful fields. */
export function printVerboseRuns(
    runs: readonly WorkflowRun[],
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
    const headers = [
        styler.strong("Run ID"),
        styler.strong("Status"),
        styler.strong("Workflow"),
        styler.strong("Branch"),
        styler.strong("Created"),
    ];
    console.log(formatTable(headers, rows, useUnicode));

    if (runs.length > 50) {
        console.log(styler.muted(`... and ${runs.length - 50} more`));
    }
}

/** Return workflow runs ordered chronologically, with invalid dates last. */
export function sortRuns(
    runs: readonly WorkflowRun[],
    order:
        | "newest"
        | "none"
        | "oldest"
): WorkflowRun[] {
    if (order === "none") {
        return [...runs];
    }

    return runs.toSorted((left, right) => {
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

function collectCounts(
    runs: readonly WorkflowRun[],
    selector: (run: WorkflowRun) => string
): [name: string, count: number][] {
    const counts = new Map<string, number>();

    for (const run of runs) {
        const key = selector(run);
        const current = counts.get(key) ?? 0;
        counts.set(key, current + 1);
    }

    return [...counts].toSorted((left, right) => {
        if (right[1] !== left[1]) {
            return right[1] - left[1];
        }
        return left[0].localeCompare(right[0]);
    });
}

function toBranchName(run: WorkflowRun): string {
    const value = run.headBranch?.trim();
    return typeof value === "string" && value.length > 0
        ? value
        : "(no branch)";
}

function toStatusLabel(run: WorkflowRun): string {
    const status = run.status?.trim() ?? "unknown";
    const conclusion = run.conclusion?.trim();
    return typeof conclusion === "string" && conclusion.length > 0
        ? `${status}/${conclusion}`
        : status;
}

function toWorkflowName(run: WorkflowRun): string {
    const value = run.workflowName?.trim();
    return typeof value === "string" && value.length > 0
        ? value
        : "(unknown workflow)";
}
