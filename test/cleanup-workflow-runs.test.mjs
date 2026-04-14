import test from "node:test";
import assert from "node:assert/strict";

import { main } from "../cleanup-workflow-runs.mjs";

function withSilentConsole(callback) {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = () => {};
    console.error = () => {};

    try {
        return callback();
    } finally {
        console.log = originalLog;
        console.error = originalError;
    }
}

test("main returns 1 when --repo is missing", () => {
    const code = withSilentConsole(() => main(["--dry-run"]));
    assert.equal(code, 1);
});

test("main returns 1 for invalid status", () => {
    const code = withSilentConsole(() =>
        main(["--repo", "owner/repo", "--status", "not-real-status"])
    );

    assert.equal(code, 1);
});

test("main returns 1 for invalid limit", () => {
    const code = withSilentConsole(() =>
        main(["--repo", "owner/repo", "--limit", "0"])
    );

    assert.equal(code, 1);
});
