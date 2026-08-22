#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const changelogPath = new URL("../CHANGELOG.md", import.meta.url);
const original = await readFile(changelogPath, "utf8");
const normalized = original.replace(
    /^(\s*)(\[dependabot\](?:\[[^\]\r\n]+\])*\([^)]+\)):/gmu,
    (_match, indentation, prefix) =>
        `${indentation}${prefix.replaceAll("[", "\\[").replaceAll("]", "\\]")}:`
);

if (normalized !== original) {
    await writeFile(changelogPath, normalized, "utf8");
}
