import { spawnSync } from "node:child_process";

const npmCliPath = process.env["npm_execpath"];
if (typeof npmCliPath !== "string" || npmCliPath.length === 0) {
    throw new Error("npm_execpath is required to refresh dependencies.");
}

const environment = Object.fromEntries(
    Object.entries(process.env).filter(
        ([name]) => name.toLowerCase() !== "npm_config_allow_scripts"
    )
);

for (const command of ["install", "update"]) {
    const result = spawnSync(process.execPath, [npmCliPath, command], {
        env: environment,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            `npm ${command} exited with status ${result.status ?? "unknown"}.`
        );
    }
}
