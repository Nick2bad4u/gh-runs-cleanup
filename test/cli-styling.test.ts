import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createProgressBar,
    createStyler,
    formatTable,
    shouldShowProgress,
    shouldUseColor,
    shouldUseUnicode,
} from "../src/cli-styling.ts";

const stdoutRestorers: (() => void)[] = [];

afterEach(() => {
    for (const restore of stdoutRestorers.toReversed()) {
        restore();
    }
    stdoutRestorers.length = 0;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

function stubStdoutProperty(
    key: "columns" | "isTTY",
    value: boolean | number
): void {
    const descriptor = Object.getOwnPropertyDescriptor(process.stdout, key);
    Object.defineProperty(process.stdout, key, {
        configurable: true,
        value,
    });
    stdoutRestorers.push(() => {
        if (descriptor === undefined) {
            Reflect.deleteProperty(process.stdout, key);
        } else {
            Object.defineProperty(process.stdout, key, descriptor);
        }
    });
}

describe(createStyler, () => {
    it("returns plain text when color is disabled", () => {
        expect.assertions(5);

        const styler = createStyler(false);

        expect(styler.error("error")).toBe("error");
        expect(styler.count(0)).toBe("0");
        expect(styler.count(2)).toBe("2");
        expect(styler.count(-1)).toBe("-1");
        expect(styler.status("unknown")).toBe("unknown");
    });

    it.each([
        ["cancelled", "33"],
        ["failure", "31"],
        ["in_progress", "36"],
        ["queued", "36"],
        ["stale", "33"],
        ["success", "32"],
        ["timed_out", "31"],
        ["unknown", "90"],
    ] as const)("colors the %s status with ANSI code %s", (status, code) => {
        expect.assertions(1);
        expect(createStyler(true).status(status)).toBe(
            `\u{1B}[${code}m${status}\u{1B}[0m`
        );
    });

    it("styles each public formatter when color is enabled", () => {
        expect.assertions(9);

        const styler = createStyler(true);

        expect(styler.arg("x")).toContain("\u{1B}[");
        expect(styler.count(0)).toContain("\u{1B}[");
        expect(styler.count(1)).toContain("\u{1B}[");
        expect(styler.error("x")).toContain("\u{1B}[");
        expect(styler.flag("x")).toContain("\u{1B}[");
        expect(styler.heading("x")).toContain("\u{1B}[");
        expect(styler.info("x")).toContain("\u{1B}[");
        expect(styler.ok("x")).toContain("\u{1B}[");
        expect(styler.warn("x")).toContain("\u{1B}[");
    });
});

describe(formatTable, () => {
    it("renders portable ASCII tables and pads ANSI-colored cells visibly", () => {
        expect.assertions(3);

        const table = formatTable(
            ["Name", "Count"],
            [["\u{1B}[31mx\u{1B}[0m", "10"]],
            false
        );

        expect(table).toContain("+------+-------+");
        expect(table).toContain("| Name | Count |");
        expect(table).toContain("\u{1B}[31mx\u{1B}[0m    | 10");
    });

    it("renders Unicode table borders and missing cells", () => {
        expect.assertions(3);

        const table = formatTable(["A", "B"], [["value"]], true);

        expect(table.startsWith("┌")).toBe(true);
        expect(table).toContain("│ value │   │");
        expect(table.endsWith("┘")).toBe(true);
    });
});

describe("terminal capability decisions", () => {
    it("only enables progress for an interactive, non-CI text invocation", () => {
        expect.assertions(6);

        stubStdoutProperty("isTTY", true);

        expect(shouldShowProgress(false, false, false, false, false)).toBe(
            true
        );
        expect(shouldShowProgress(true, false, false, false, false)).toBe(
            false
        );
        expect(shouldShowProgress(false, true, false, false, false)).toBe(
            false
        );
        expect(shouldShowProgress(false, false, true, false, false)).toBe(
            false
        );
        expect(shouldShowProgress(false, false, false, true, false)).toBe(
            false
        );
        expect(shouldShowProgress(false, false, false, false, true)).toBe(
            false
        );
    });

    it("respects explicit and environment color controls", () => {
        expect.assertions(7);

        stubStdoutProperty("isTTY", true);
        vi.stubEnv("FORCE_COLOR", undefined);
        vi.stubEnv("NO_COLOR", undefined);

        expect(shouldUseColor("always", false)).toBe(true);
        expect(shouldUseColor("never", false)).toBe(false);
        expect(shouldUseColor("always", true)).toBe(false);
        expect(shouldUseColor("auto", false)).toBe(true);

        vi.stubEnv("NO_COLOR", "1");

        expect(shouldUseColor("auto", false)).toBe(false);

        vi.stubEnv("NO_COLOR", undefined);
        vi.stubEnv("FORCE_COLOR", "0");

        expect(shouldUseColor("auto", false)).toBe(false);

        vi.stubEnv("FORCE_COLOR", "1");

        expect(shouldUseColor("auto", false)).toBe(true);
    });

    it("respects explicit, JSON, terminal, and TERM Unicode controls", () => {
        expect.assertions(6);

        stubStdoutProperty("isTTY", true);
        vi.stubEnv("TERM", "xterm-256color");

        expect(shouldUseUnicode("always", false)).toBe(true);
        expect(shouldUseUnicode("never", false)).toBe(false);
        expect(shouldUseUnicode("always", true)).toBe(false);
        expect(shouldUseUnicode("auto", false)).toBe(true);

        vi.stubEnv("TERM", "dumb");

        expect(shouldUseUnicode("auto", false)).toBe(false);

        stubStdoutProperty("isTTY", false);

        expect(shouldUseUnicode("auto", false)).toBe(false);
    });
});

describe(createProgressBar, () => {
    it("returns a no-op renderer when disabled or empty", () => {
        expect.assertions(1);

        const writeSpy = vi
            .spyOn(process.stdout, "write")
            .mockReturnValue(true);
        const progress = createProgressBar(
            "Work",
            0,
            createStyler(false),
            true
        );

        progress.update(1, "ignored");
        progress.done();

        expect(writeSpy).not.toHaveBeenCalled();
    });

    it("renders, clamps, truncates, updates, and finishes an enabled bar", () => {
        expect.assertions(4);

        stubStdoutProperty("columns", 46);
        const writeSpy = vi
            .spyOn(process.stdout, "write")
            .mockReturnValue(true);
        const progress = createProgressBar(
            "Work",
            2,
            createStyler(false),
            true
        );

        progress.update(-5, "a very long progress suffix");
        progress.update(10, "done");
        progress.done();

        const output = writeSpy.mock.calls
            .map(([value]) => String(value))
            .join("");

        expect(output).toContain("0/2 0%");
        expect(output).toContain("2/2 100%");
        expect(output).toContain("…");
        expect(output.endsWith("\n")).toBe(true);
    });
});
