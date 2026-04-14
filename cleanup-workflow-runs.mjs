#!/usr/bin/env node

/**
 * Cleanup GitHub Actions workflow runs through the GH CLI.
 *
 * Reusable across repositories via --repo owner/name.
 *
 * Examples:
 *   node cleanup-workflow-runs.mjs --repo Nick2bad4u/gh-runs-cleanup --status failure,cancelled --limit 200 --confirm
 *   node scripts/cleanup-workflow-runs.mjs --repo owner/repo --workflow "CI" --branch main --dry-run
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * @typedef {Object} WorkflowRun
 * @property {number} databaseId
 * @property {string} [status]
 * @property {string} [conclusion]
 * @property {string} [workflowName]
 * @property {string} [headBranch]
 * @property {string} [event]
 * @property {string} [createdAt]
 * @property {string} [displayTitle]
 * @property {string} [url]
 */

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

/**
 * @param {string[]} args
 * @returns {Record<string, string | boolean | string[]>}
 */
function parseArguments(args) {
    /** @type {Record<string, string | boolean | string[]>} */
    const parsed = {};

    for (let index = 0; index < args.length; index += 1) {
        const token = args[index];
        if (!token.startsWith("--")) {
            continue;
        }

        const [rawKey, inlineValue] = token.slice(2).split("=", 2);
        const key = rawKey.trim();

        if (
            key === "dry-run" ||
            key === "confirm" ||
            key === "verbose" ||
            key === "help"
        ) {
            parsed[key] = true;
            continue;
        }

        const nextToken = args[index + 1];
        const value =
            inlineValue ??
            (nextToken && !nextToken.startsWith("--") ? nextToken : "");

        if (inlineValue === undefined && nextToken && !nextToken.startsWith("--")) {
            index += 1;
        }

        if (key === "status") {
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

function printHelp() {
    return `gh-runs-cleanup

Delete GitHub Actions workflow runs using gh CLI.

Required:
  --repo <owner/name>           Target repository (works across repos)

Filters:
  --status <value[,value...]>   Run statuses to target (repeatable)
                                default: failure,cancelled
  --workflow <name|id>          Filter by workflow name or id
  --branch <name>               Filter by branch
  --event <event>               Filter by triggering event
  --user <login>                Filter by actor
  --commit <sha>                Filter by commit SHA
  --created <date>              GitHub created-date filter (same as gh run list)
  --limit <n>                   Max runs to fetch per status (default: 200)
  --max-delete <n>              Safety cap on number of deletions

Execution:
  --dry-run                     Show what would be deleted without deleting
  --confirm                     Required to perform deletion
  --verbose                     Show per-run details
  --help                        Show this help

Examples:
    gh runs-cleanup --repo owner/repo --confirm
    gh runs-cleanup --repo owner/repo --status failure,cancelled --limit 500 --confirm
    gh runs-cleanup --repo owner/repo --workflow "CI" --branch main --dry-run
`;
}

/**
 * @param {string[]} args
 * @param {boolean} [capture=true]
 * @returns {{ stdout: string; stderr: string; status: number }}
 */
function runGh(args, capture = true) {
    const result = spawnSync("gh", args, {
        encoding: "utf8",
        stdio: capture ? "pipe" : "inherit",
    });

    return {
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
        status: result.status ?? 1,
    };
}

/**
 * @param {string} repo
 * @param {string} status
 * @param {Record<string, string | boolean | string[]>} options
 * @returns {WorkflowRun[]}
 */
function listRuns(repo, status, options) {
    const args = [
        "run",
        "list",
        "--repo",
        repo,
        "--status",
        status,
        "--limit",
        String(options.limit ?? "200"),
        "--json",
        "databaseId,status,conclusion,workflowName,headBranch,event,createdAt,displayTitle,url",
    ];

    const mappings = [
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
        throw new Error(response.stderr || `gh run list failed for status ${status}`);
    }

    /** @type {unknown} */
    const parsed = JSON.parse(response.stdout || "[]");
    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => /** @type {WorkflowRun} */ (entry));
}

/**
 * @param {string} repo
 * @param {number} runId
 */
function deleteRun(repo, runId) {
    const endpoint = `/repos/${repo}/actions/runs/${runId}`;
    const response = runGh(["api", "-X", "DELETE", endpoint]);
    return response.status === 0;
}

/**
 * @param {string[]} argv
 * @returns {number}
 */
export function main(argv) {
    const options = parseArguments(argv);

    if (options.help === true) {
        console.log(printHelp());
        return 0;
    }

    const repo = options.repo;
    if (typeof repo !== "string" || repo.length === 0) {
        console.error("Error: --repo <owner/name> is required.");
        console.log(printHelp());
        return 1;
    }

    const dryRun = options["dry-run"] === true;
    const confirm = options.confirm === true;
    const verbose = options.verbose === true;

    const rawStatusValues = Array.isArray(options.status)
        ? options.status
        : options.status
          ? [String(options.status)]
          : ["failure,cancelled"];

    const statuses = rawStatusValues
        .flatMap((part) => String(part).split(","))
        .map((part) => part.trim())
        .filter(Boolean);

    if (statuses.length === 0) {
        console.error("Error: at least one --status value is required.");
        return 1;
    }

    const invalidStatuses = statuses.filter((status) => !VALID_STATUSES.has(status));
    if (invalidStatuses.length > 0) {
        console.error(`Error: invalid statuses: ${invalidStatuses.join(", ")}`);
        console.error(`Valid values: ${Array.from(VALID_STATUSES).join(", ")}`);
        return 1;
    }

    const limit = Number.parseInt(String(options.limit ?? "200"), 10);
    if (!Number.isFinite(limit) || limit < 1) {
        console.error("Error: --limit must be a positive integer.");
        return 1;
    }

    const maxDeleteOption = options["max-delete"];
    const maxDelete =
        typeof maxDeleteOption === "string"
            ? Number.parseInt(maxDeleteOption, 10)
            : undefined;

    if (
        maxDeleteOption !== undefined &&
        (typeof maxDelete !== "number" || !Number.isFinite(maxDelete) || maxDelete < 1)
    ) {
        console.error("Error: --max-delete must be a positive integer.");
        return 1;
    }

    options.limit = String(limit);

    // Validate gh auth quickly.
    const authResult = runGh(["auth", "status"]);
    if (authResult.status !== 0) {
        console.error("Error: gh CLI is not authenticated. Run: gh auth login");
        return 1;
    }

    /** @type {WorkflowRun[]} */
    const allRuns = [];

    for (const status of statuses) {
        const runs = listRuns(repo, status, options);
        allRuns.push(...runs);
    }

    const uniqueById = new Map();
    for (const run of allRuns) {
        uniqueById.set(run.databaseId, run);
    }

    const runsToProcess = Array.from(uniqueById.values());

    console.log(`Repo: ${repo}`);
    console.log(`Statuses: ${statuses.join(", ")}`);
    console.log(`Matched runs: ${runsToProcess.length}`);

    if (runsToProcess.length === 0) {
        console.log("Nothing to delete.");
        return 0;
    }

    if (verbose || dryRun) {
        for (const run of runsToProcess.slice(0, 50)) {
            console.log(
                `- ${run.databaseId} | ${run.status ?? ""}/${run.conclusion ?? ""} | ${run.workflowName ?? ""} | ${run.headBranch ?? ""} | ${run.createdAt ?? ""}`
            );
        }

        if (runsToProcess.length > 50) {
            console.log(`... and ${runsToProcess.length - 50} more`);
        }
    }

    if (dryRun) {
        console.log("Dry run complete: no deletions performed.");
        return 0;
    }

    if (!confirm) {
        console.error(
            "Safety stop: pass --confirm to perform deletion, or use --dry-run to preview."
        );
        return 1;
    }

    const candidates =
        Number.isFinite(maxDelete) && maxDelete !== undefined
            ? runsToProcess.slice(0, maxDelete)
            : runsToProcess;

    if (maxDelete !== undefined && runsToProcess.length > maxDelete) {
        console.log(
            `Applying safety cap: deleting first ${maxDelete} of ${runsToProcess.length} matched runs.`
        );
    }

    let deleted = 0;
    /** @type {number[]} */
    const failedIds = [];

    for (const run of candidates) {
        const ok = deleteRun(repo, run.databaseId);
        if (ok) {
            deleted += 1;
            if (verbose) {
                console.log(`Deleted run ${run.databaseId}`);
            }
        } else {
            failedIds.push(run.databaseId);
        }
    }

    console.log(`Deleted: ${deleted}`);
    console.log(`Failed: ${failedIds.length}`);

    if (failedIds.length > 0) {
        console.log(`Failed IDs (first 50): ${failedIds.slice(0, 50).join(", ")}`);
        return 2;
    }

    return 0;
}

export function runCli() {
    try {
        const code = main(process.argv.slice(2));
        process.exit(code);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${message}`);
        process.exit(1);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runCli();
}
