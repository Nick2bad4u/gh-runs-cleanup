#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = join(repositoryRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const osNames = new Map([
    ["darwin", "darwin"],
    ["linux", "linux"],
    ["win32", "windows"],
]);

const architectureNames = new Map([
    ["arm64", "arm64"],
    ["ia32", "386"],
    ["x64", "amd64"],
]);

function readOption(name) {
    const prefix = `--${name}=`;
    const inline = process.argv.find((argument) => argument.startsWith(prefix));
    if (inline) {
        return inline.slice(prefix.length);
    }

    const index = process.argv.indexOf(`--${name}`);
    if (index >= 0) {
        return process.argv[index + 1];
    }

    return undefined;
}

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

const packageName = packageJson.name;
if (typeof packageName !== "string" || !packageName.startsWith("gh-")) {
    throw new Error("package.json name must be a gh-* extension name.");
}

const platform = readOption("platform") ?? osNames.get(process.platform);
const architecture = readOption("arch") ?? architectureNames.get(process.arch);
const nodeExecutable = readOption("node-executable");

if (
    !platform ||
    ![
        "darwin",
        "linux",
        "windows",
    ].includes(platform)
) {
    throw new Error(`Unsupported extension asset platform: ${platform}`);
}

if (
    !architecture ||
    ![
        "386",
        "amd64",
        "arm64",
    ].includes(architecture)
) {
    throw new Error(
        `Unsupported extension asset architecture: ${architecture}`
    );
}

const temporaryDirectory = join(repositoryRoot, "temp", "sea");
const distributionDirectory = join(repositoryRoot, "dist");
const entrypointPath = join(temporaryDirectory, "entrypoint.ts");
const bundlePath = join(temporaryDirectory, `${packageName}.mjs`);
const seaConfigPath = join(temporaryDirectory, "sea-config.json");
const outputFileName = `${packageName}-${platform}-${architecture}${
    platform === "windows" ? ".exe" : ""
}`;
const outputPath = join(distributionDirectory, outputFileName);

await rm(temporaryDirectory, { force: true, recursive: true });
await mkdir(temporaryDirectory, { recursive: true });
await mkdir(distributionDirectory, { recursive: true });

await writeFile(
    entrypointPath,
    'import { runCli } from "../../src/cli.ts";\n\nrunCli();\n',
    "utf8"
);

await build({
    bundle: true,
    entryPoints: [entrypointPath],
    format: "esm",
    logLevel: "info",
    outfile: bundlePath,
    platform: "node",
    target: "node25",
});

const seaConfig = {
    disableExperimentalSEAWarning: true,
    execArgvExtension: "env",
    main: bundlePath,
    mainFormat: "module",
    output: outputPath,
    useCodeCache: false,
};

if (nodeExecutable) {
    seaConfig.executable = resolve(repositoryRoot, nodeExecutable);
}

await writeFile(
    seaConfigPath,
    `${JSON.stringify(seaConfig, null, 4)}\n`,
    "utf8"
);

run(process.execPath, [`--build-sea=${seaConfigPath}`]);

if (platform !== "windows") {
    await chmod(outputPath, 0o755);
}

console.log(`Built ${outputFileName}`);
