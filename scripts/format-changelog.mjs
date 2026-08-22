import { readFile, writeFile } from "node:fs/promises";
import * as nodePath from "node:path";
import { format, resolveConfig } from "prettier";

const MAXIMUM_FORMAT_PASSES = 5;
const changelogPath = nodePath.resolve(import.meta.dirname, "../CHANGELOG.md");
const original = await readFile(changelogPath, "utf8");
const resolvedConfig = (await resolveConfig(changelogPath)) ?? {};
let formatted = original;
let passCount = 0;
let isStable = false;

while (!isStable && passCount < MAXIMUM_FORMAT_PASSES) {
    const previous = formatted;
    formatted = await format(previous, {
        ...resolvedConfig,
        filepath: changelogPath,
    });
    passCount += 1;
    isStable = formatted === previous;
}

if (!isStable) {
    throw new Error(
        `CHANGELOG.md did not reach stable formatting after ${MAXIMUM_FORMAT_PASSES} passes.`
    );
}

if (formatted !== original) {
    await writeFile(changelogPath, formatted, "utf8");
}
console.log(`CHANGELOG.md reached stable formatting in ${passCount} passes.`);
