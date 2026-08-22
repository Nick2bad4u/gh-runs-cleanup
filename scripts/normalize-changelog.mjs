import { readFile, writeFile } from "node:fs/promises";

import { normalizeDependabotPrefixes } from "./changelog-normalization.mts";

const changelogPath = new URL("../CHANGELOG.md", import.meta.url);
const original = await readFile(changelogPath, "utf8");
const normalized = normalizeDependabotPrefixes(original);

if (normalized !== original) {
    await writeFile(changelogPath, normalized, "utf8");
}
