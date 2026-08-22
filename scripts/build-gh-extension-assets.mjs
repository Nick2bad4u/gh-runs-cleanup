import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { chmod, mkdir, rm, writeFile } from "node:fs/promises";
import * as nodePath from "node:path";

const repositoryRoot = nodePath.resolve(import.meta.dirname, "..");
const packageJsonPath = nodePath.join(repositoryRoot, "package.json");
const parsedPackageJson = /** @type {unknown} */ (
    JSON.parse(readFileSync(packageJsonPath, "utf8"))
);
if (!isRecord(parsedPackageJson)) {
    throw new TypeError("Expected package.json to contain an object.");
}

const packageName = parsedPackageJson.name;
if (typeof packageName !== "string" || !packageName.startsWith("gh-")) {
    throw new Error("package.json name must be a gh-* extension name.");
}

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

const supportedArchitectures = new Set([
    "386",
    "amd64",
    "arm64",
]);
const supportedPlatforms = new Set([
    "darwin",
    "linux",
    "windows",
]);

/**
 * @param {unknown} value
 *
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
    return typeof value === "object" && value !== null;
}

/**
 * @param {string} name
 *
 * @returns {string | undefined}
 */
function readOption(name) {
    const prefix = `--${name}=`;
    const inline = process.argv.find((argument) => argument.startsWith(prefix));
    if (inline !== undefined) {
        return inline.slice(prefix.length);
    }

    const index = process.argv.indexOf(`--${name}`);
    if (index !== -1) {
        return process.argv[index + 1];
    }

    return undefined;
}

/**
 * @param {string} command
 * @param {readonly string[]} argumentList
 */
function run(command, argumentList) {
    const result = spawnSync(command, argumentList, {
        cwd: repositoryRoot,
        stdio: "inherit",
    });

    if (result.error !== undefined) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            `${command} exited with status ${result.status ?? "unknown"}.`
        );
    }
}

/**
 * @param {string} executablePath
 * @param {string} expectedHeading
 */
function smokeTestExecutable(executablePath, expectedHeading) {
    const result = spawnSync(executablePath, ["--help"], {
        cwd: repositoryRoot,
        encoding: "utf8",
    });

    if (result.error !== undefined) {
        throw result.error;
    }

    if (result.status !== 0) {
        const exitStatus =
            typeof result.status === "number"
                ? result.status.toString()
                : "unknown";
        throw new Error(
            `${executablePath} --help exited with status ${exitStatus}: ${result.stderr}`
        );
    }

    const headingCount = result.stdout
        .split(/\r?\n/v)
        .filter((line) => line === expectedHeading).length;
    if (headingCount !== 1) {
        throw new Error(
            `Expected one ${expectedHeading} help heading, found ${headingCount}.`
        );
    }
}

const platform = readOption("platform") ?? osNames.get(process.platform);

if (typeof platform !== "string" || !supportedPlatforms.has(platform)) {
    throw new Error(
        `Unsupported extension asset platform: ${String(platform)}`
    );
}

const architecture = readOption("arch") ?? architectureNames.get(process.arch);
if (
    typeof architecture !== "string" ||
    !supportedArchitectures.has(architecture)
) {
    throw new Error(
        `Unsupported extension asset architecture: ${String(architecture)}`
    );
}

const nodeExecutable = readOption("node-executable");
const temporaryDirectory = nodePath.join(repositoryRoot, "temp", "sea");
const distributionDirectory = nodePath.join(repositoryRoot, "dist");
const entrypointPath = nodePath.join(temporaryDirectory, "entrypoint.ts");
const bundlePath = nodePath.join(temporaryDirectory, `${packageName}.mjs`);
const seaConfigPath = nodePath.join(temporaryDirectory, "sea-config.json");
const outputFileName = `${packageName}-${platform}-${architecture}${
    platform === "windows" ? ".exe" : ""
}`;
const outputPath = nodePath.join(distributionDirectory, outputFileName);

await rm(temporaryDirectory, { force: true, recursive: true });
await mkdir(temporaryDirectory, { recursive: true });
await mkdir(distributionDirectory, { recursive: true });

await writeFile(entrypointPath, 'import "../../src/cli.ts";\n', "utf8");

await build({
    bundle: true,
    entryPoints: [entrypointPath],
    format: "esm",
    logLevel: "info",
    outfile: bundlePath,
    platform: "node",
    target: "node22.18",
});

/**
 * @type {{
 *     disableExperimentalSEAWarning: boolean;
 *     executable?: string;
 *     execArgvExtension: string;
 *     main: string;
 *     mainFormat: string;
 *     output: string;
 *     useCodeCache: boolean;
 * }}
 */
const seaConfig = {
    disableExperimentalSEAWarning: true,
    execArgvExtension: "env",
    main: bundlePath,
    mainFormat: "module",
    output: outputPath,
    useCodeCache: false,
};

if (nodeExecutable !== undefined) {
    seaConfig.executable = nodePath.resolve(repositoryRoot, nodeExecutable);
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

if (
    platform === osNames.get(process.platform) &&
    architecture === architectureNames.get(process.arch)
) {
    smokeTestExecutable(outputPath, packageName);
    console.log(`Smoke-tested ${outputFileName}`);
}
