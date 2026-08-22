import { stripVTControlCharacters } from "node:util";

import type { ColorMode, Styler, UnicodeMode } from "./cli-types.ts";

/** Mutable progress renderer returned to the deletion loop. */
export interface ProgressState {
    readonly done: () => void;
    readonly update: (completed: number, suffix?: string) => void;
}

/** Create an in-place terminal progress bar or a no-op renderer. */
export function createProgressBar(
    title: string,
    total: number,
    styler: Styler,
    isEnabled: boolean
): ProgressState {
    if (!isEnabled || total <= 0) {
        return {
            done: () => undefined,
            update: () => undefined,
        };
    }

    const width = 24;
    const totalSafe = Math.max(1, total);

    const render = (completed: number, suffix = ""): void => {
        const clamped = Math.min(Math.max(completed, 0), totalSafe);
        const percent = Math.floor((clamped / totalSafe) * 100);
        const filled = Math.round((clamped / totalSafe) * width);
        const bar = `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
        const progressText = `${clamped}/${totalSafe}`;
        const plainPrefix = `${title} [${bar}] ${progressText} ${percent}%`;
        const terminalWidth = process.stdout.columns;
        const suffixBudget =
            typeof terminalWidth === "number" && terminalWidth > 0
                ? Math.max(0, terminalWidth - plainPrefix.length - 1)
                : undefined;

        const suffixText = computeSuffixText(suffixBudget, suffix);
        const percentStr = `${percent}%`;
        const suffixPart =
            suffixText.length > 0 ? ` ${styler.muted(suffixText)}` : "";
        const line = `${styler.info(title)} ${styler.muted("[")}${styler.ok(bar)}${styler.muted("]")} ${styler.strong(progressText)} ${styler.muted(percentStr)}${suffixPart}`;
        process.stdout.write(`\r\u{1B}[2K${line}`);
    };

    render(0);

    return {
        done: () => {
            render(totalSafe);
            process.stdout.write("\n");
        },
        update: (completed, suffix = "") => {
            render(completed, suffix);
        },
    };
}

/** Create the ANSI-aware formatter used by human-readable output. */
export function createStyler(useColor: boolean): Styler {
    const apply = (code: string, text: string): string =>
        useColor ? `\u{1B}[${code}m${text}\u{1B}[0m` : text;

    const status = (text: string): string => {
        const normalized = text.toLowerCase();
        if (
            normalized.includes("failure") ||
            normalized.includes("timed_out")
        ) {
            return apply("31", text);
        }
        if (normalized.includes("cancelled") || normalized.includes("stale")) {
            return apply("33", text);
        }
        if (normalized.includes("success")) {
            return apply("32", text);
        }
        if (
            normalized.includes("in_progress") ||
            normalized.includes("queued")
        ) {
            return apply("36", text);
        }
        return apply("90", text);
    };

    return {
        arg: (text) => apply("38;5;221", text),
        count: (value) => {
            if (value === 0) return apply("90", String(value));
            if (value > 0) return apply("1;36", String(value));
            return String(value);
        },
        error: (text) => apply("31", text),
        flag: (text) => apply("38;5;51", text),
        heading: (text) => apply("1;36", text),
        info: (text) => apply("36", text),
        muted: (text) => apply("90", text),
        ok: (text) => apply("32", text),
        status,
        strong: (text) => apply("1", text),
        warn: (text) => apply("33", text),
    };
}

/** Format a table using Unicode or portable ASCII border glyphs. */
export function formatTable(
    headers: readonly string[],
    rows: readonly (readonly string[])[],
    useUnicode: boolean
): string {
    const widths = headers.map((header, column) =>
        Math.max(
            visibleLength(header),
            ...rows.map((row) => visibleLength(row[column] ?? ""))
        )
    );

    const style = useUnicode
        ? {
              bl: "└",
              br: "┘",
              bt: "┴",
              h: "─",
              j: "┼",
              lt: "├",
              rt: "┤",
              tl: "┌",
              tr: "┐",
              tt: "┬",
              v: "│",
          }
        : {
              bl: "+",
              br: "+",
              bt: "+",
              h: "-",
              j: "+",
              lt: "+",
              rt: "+",
              tl: "+",
              tr: "+",
              tt: "+",
              v: "|",
          };

    const horizontal = widths.map((width) => style.h.repeat(width + 2));
    const top = `${style.tl}${horizontal.join(style.tt)}${style.tr}`;
    const middle = `${style.lt}${horizontal.join(style.j)}${style.rt}`;
    const bottom = `${style.bl}${horizontal.join(style.bt)}${style.br}`;

    const cellSep = ` ${style.v} `;
    const renderRow = (cells: readonly string[]): string =>
        `${style.v} ${widths
            .map((width, index) => padVisible(cells[index] ?? "", width))
            .join(cellSep)} ${style.v}`;

    const lines = [
        top,
        renderRow(headers),
        middle,
        ...rows.map((row) => renderRow(row)),
        bottom,
    ];

    return lines.join("\n");
}

/** Determine whether interactive progress output is safe for this invocation. */
export function shouldShowProgress(
    isJsonOutput: boolean,
    isQuiet: boolean,
    isVerbose: boolean,
    disableProgress: boolean,
    isCi: boolean
): boolean {
    return (
        !isJsonOutput &&
        !isQuiet &&
        !isVerbose &&
        !disableProgress &&
        !isCi &&
        process.stdout.isTTY
    );
}

/** Determine whether color output is enabled for this invocation. */
export function shouldUseColor(
    mode: ColorMode,
    isJsonOutput: boolean
): boolean {
    if (isJsonOutput) {
        return false;
    }

    if (mode === "always") {
        return true;
    }

    if (mode === "never") {
        return false;
    }

    if (process.env["NO_COLOR"] !== undefined) {
        return false;
    }

    const forced = process.env["FORCE_COLOR"];
    if (typeof forced === "string") {
        return forced !== "0";
    }

    return process.stdout.isTTY;
}

/** Determine whether Unicode table glyphs are enabled for this invocation. */
export function shouldUseUnicode(
    mode: UnicodeMode,
    isJsonOutput: boolean
): boolean {
    if (isJsonOutput) {
        return false;
    }

    if (mode === "always") {
        return true;
    }

    if (mode === "never") {
        return false;
    }

    const term = process.env["TERM"];
    if (term === "dumb") {
        return false;
    }

    return process.stdout.isTTY;
}

function computeSuffixText(budget: number | undefined, suffix: string): string {
    if (typeof budget !== "number") return suffix;
    if (budget <= 0) return "";
    return suffix.length <= budget
        ? suffix
        : `${suffix.slice(0, Math.max(0, budget - 1))}\u{2026}`;
}

function padVisible(value: string, width: number): string {
    const difference = width - visibleLength(value);
    return difference > 0 ? `${value}${" ".repeat(difference)}` : value;
}

function visibleLength(value: string): number {
    return stripVTControlCharacters(value).length;
}
