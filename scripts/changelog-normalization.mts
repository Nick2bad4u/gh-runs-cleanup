const DEPENDABOT_PREFIX = "[dependabot]";

/** Escape a generated Dependabot prefix so Markdown does not parse it as a link. */
export function normalizeDependabotPrefixes(changelog: string): string {
    return changelog
        .split("\n")
        .map((line) => normalizeDependabotLine(line))
        .join("\n");
}

function normalizeDependabotLine(line: string): string {
    const indentationLength = line.length - line.trimStart().length;
    const indentation = line.slice(0, indentationLength);
    const content = line.slice(indentationLength);

    if (!content.startsWith(DEPENDABOT_PREFIX)) {
        return line;
    }

    let cursor = DEPENDABOT_PREFIX.length;
    while (content[cursor] === "[") {
        const closingBracket = content.indexOf("]", cursor + 1);
        if (closingBracket <= cursor + 1) {
            return line;
        }
        cursor = closingBracket + 1;
    }

    if (content[cursor] !== "(") {
        return line;
    }

    const closingParenthesis = content.indexOf(")", cursor + 1);
    if (
        closingParenthesis <= cursor + 1 ||
        content[closingParenthesis + 1] !== ":"
    ) {
        return line;
    }

    const prefix = content.slice(0, closingParenthesis + 1);
    const escapedPrefix = prefix
        .replaceAll("[", String.raw`\[`)
        .replaceAll("]", String.raw`\]`);

    return `${indentation}${escapedPrefix}${content.slice(closingParenthesis + 1)}`;
}
