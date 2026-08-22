import { describe, expect, it } from "vitest";

import { normalizeDependabotPrefixes } from "../scripts/changelog-normalization.mts";

describe(normalizeDependabotPrefixes, () => {
    it("escapes Dependabot prefixes with qualifiers and indentation", () => {
        expect.assertions(1);

        const input = [
            "[dependabot](deps): Update one dependency",
            "  [dependabot][all](deps): Update a dependency group",
        ].join("\n");

        expect(normalizeDependabotPrefixes(input)).toBe(
            [
                "&#91;dependabot&#93;(deps): Update one dependency",
                "  &#91;dependabot&#93;&#91;all&#93;(deps): Update a dependency group",
            ].join("\n")
        );
    });

    it("preserves unrelated, malformed, and already-normalized lines", () => {
        expect.assertions(1);

        const input = [
            "feat: regular entry",
            "[dependabot](): empty scope",
            "[dependabot][all(deps): malformed qualifier",
            "&#91;dependabot&#93;(deps): already normalized",
        ].join("\n");

        expect(normalizeDependabotPrefixes(input)).toBe(input);
    });

    it("preserves CRLF line endings and is idempotent", () => {
        expect.assertions(2);

        const input = "[dependabot][npm](deps): Update\r\nNext line\r\n";
        const normalized = normalizeDependabotPrefixes(input);

        expect(normalized).toBe(
            [
                "&#91;dependabot&#93;&#91;npm&#93;(deps): Update",
                "Next line",
                "",
            ].join("\r\n")
        );
        expect(normalizeDependabotPrefixes(normalized)).toBe(normalized);
    });
});
