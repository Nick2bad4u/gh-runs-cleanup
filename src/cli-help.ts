import type { Styler } from "./cli-types.ts";

interface HelpOption {
    arg?: string;
    description: string;
    flag: string;
}

interface HelpSection {
    options?: HelpOption[];
    title: string;
}

interface HelpStyles {
    arg: (text: string) => string;
    flag: (text: string) => string;
    heading: (text: string) => string;
    title: (text: string) => string;
}

const HELP_SECTIONS: HelpSection[] = [
    {
        options: [
            {
                arg: "<owner/name>",
                description:
                    "Target repository (optional if run inside a repo)",
                flag: "--repo",
            },
            {
                arg: "<owner/name[,..]>",
                description: "Multiple target repositories (repeatable)",
                flag: "--repos",
            },
            {
                description: "Target all repositories for an owner/login",
                flag: "--all-repos",
            },
            {
                arg: "<login>",
                description:
                    "Owner/login used with --all-repos (default: authenticated user)",
                flag: "--owner",
            },
        ],
        title: "Target repository",
    },
    {
        options: [
            {
                arg: "<value[,value...]>",
                description:
                    "Run statuses to target (repeatable; default: failure,cancelled)",
                flag: "--status",
            },
            {
                description: "Target all valid statuses",
                flag: "--all-statuses",
            },
            {
                arg: "<name|id>",
                description: "Filter by workflow name or id",
                flag: "--workflow",
            },
            {
                arg: "<name[,name...]>",
                description: "Exclude matching workflow names (repeatable)",
                flag: "--exclude-workflow",
            },
            {
                arg: "<name>",
                description: "Filter by branch",
                flag: "--branch",
            },
            {
                arg: "<name[,name...]>",
                description: "Exclude matching branch names (repeatable)",
                flag: "--exclude-branch",
            },
            {
                arg: "<event>",
                description: "Filter by triggering event",
                flag: "--event",
            },
            {
                arg: "<login>",
                description: "Filter by actor",
                flag: "--user",
            },
            {
                arg: "<sha>",
                description: "Filter by commit SHA",
                flag: "--commit",
            },
            {
                arg: "<date>",
                description: "GitHub created-date filter (same as gh run list)",
                flag: "--created",
            },
            {
                arg: "<n>",
                description: "Only delete runs older than N days",
                flag: "--before-days",
            },
            {
                arg: "<n>",
                description: "Max runs to fetch per status (default: 500)",
                flag: "--limit",
            },
            {
                arg: "<n>",
                description: "Safety cap on number of deletions",
                flag: "--max-delete",
            },
            {
                arg: "<oldest|newest|none>",
                description: "Processing order (default: oldest)",
                flag: "--order",
            },
        ],
        title: "Filters",
    },
    {
        options: [
            {
                description: "Show what would be deleted without deleting",
                flag: "--dry-run",
            },
            {
                description: "Required to perform deletion",
                flag: "--confirm",
            },
            {
                description: "Alias for --confirm",
                flag: "--yes",
            },
            {
                arg: "<n>",
                description: "Delete retry attempts (default: 2)",
                flag: "--max-retries",
            },
            {
                arg: "<n>",
                description: "Initial retry delay in ms (default: 200)",
                flag: "--retry-delay-ms",
            },
            {
                description: "Stop deleting after first failed run",
                flag: "--fail-fast",
            },
            {
                arg: "<n>",
                description: "Stop after N failed deletions",
                flag: "--max-failures",
            },
            {
                description: "Show per-run details",
                flag: "--verbose",
            },
            {
                description: "Show expanded summaries (tables, grouped counts)",
                flag: "--summary",
            },
            {
                description: "Reduce non-error output in text mode",
                flag: "--quiet",
            },
        ],
        title: "Execution",
    },
    {
        options: [
            {
                description: "Emit structured JSON output",
                flag: "--json",
            },
            {
                arg: "<auto|always|never>",
                description: "Color mode for text output (default: auto)",
                flag: "--color",
            },
            {
                description: "Alias for --color never",
                flag: "--no-color",
            },
            {
                arg: "<auto|always|never>",
                description: "Unicode table borders/symbols (default: auto)",
                flag: "--unicode",
            },
            {
                description: "Alias for --unicode never",
                flag: "--no-unicode",
            },
            {
                description: "Disable progress bars in interactive terminals",
                flag: "--no-progress",
            },
            {
                description:
                    "CI-friendly output (disables interactive formatting)",
                flag: "--ci",
            },
        ],
        title: "Output",
    },
    {
        options: [
            {
                description: "Show this help",
                flag: "--help",
            },
        ],
        title: "Help",
    },
];

const HELP_NOTES = [
    "--workflow uses compatibility mode, so progress may update less frequently.",
];

const HELP_EXAMPLES = [
    "gh runs-cleanup --repo owner/repo --confirm",
    "gh runs-cleanup --repos owner/repo,owner/other-repo --dry-run",
    "gh runs-cleanup --all-repos --owner my-user --status failure --confirm",
    "gh runs-cleanup --repo owner/repo --status failure,cancelled --limit 500 --confirm",
    'gh runs-cleanup --repo owner/repo --workflow "CI" --branch main --dry-run',
    "gh runs-cleanup --repo owner/repo --json --dry-run",
    "gh runs-cleanup --before-days 30 --status failure --confirm",
];

/** Build the complete CLI help text, optionally with terminal styling. */
export function buildHelpText(styler?: Styler): string {
    const styles = createHelpStyles(styler);

    const optionLabelWidths = HELP_SECTIONS.flatMap((section) =>
        (section.options ?? []).map((option) =>
            getHelpOptionLabelLength(option)
        )
    );
    const maxLabelWidth = Math.max(...optionLabelWidths, 0);

    const lines: readonly string[] = [
        styles.title("gh-runs-cleanup"),
        "",
        "  Delete GitHub Actions workflow runs using the gh CLI.",
        "",
        styles.heading("  Usage:"),
        `    ${styleCommandExample("gh runs-cleanup", styler)} ${styles.arg("[options]")}`,
        "",
        ...HELP_SECTIONS.flatMap((section) =>
            renderHelpSection(section, maxLabelWidth, styles)
        ),
        styles.heading("  Notes:"),
        ...HELP_NOTES.map((note) => `    ${styleCommandExample(note, styler)}`),
        "",
        styles.heading("  Examples:"),
        ...HELP_EXAMPLES.map(
            (example) => `    ${styleCommandExample(example, styler)}`
        ),
        "  ",
    ];

    return lines.join("\n");
}

/** Return unstyled CLI help text. */
export function printHelp(): string {
    return buildHelpText();
}

/** Render CLI help text using the supplied terminal styler. */
export function renderHelpText(styler: Styler): string {
    return buildHelpText(styler);
}

function createHelpStyles(styler: Styler | undefined): HelpStyles {
    return {
        arg: (text) => (styler === undefined ? text : styler.arg(text)),
        flag: (text) => (styler === undefined ? text : styler.flag(text)),
        heading: (text) => (styler === undefined ? text : styler.info(text)),
        title: (text) => (styler === undefined ? text : styler.heading(text)),
    };
}

function getHelpOptionArgument(
    option: Readonly<HelpOption>
): string | undefined {
    return option.arg === undefined || option.arg.length === 0
        ? undefined
        : option.arg;
}

function getHelpOptionLabelLength(option: Readonly<HelpOption>): number {
    const argument = getHelpOptionArgument(option);
    const argumentSuffix = argument === undefined ? "" : ` ${argument}`;
    return `${option.flag}${argumentSuffix}`.length;
}

function renderHelpOption(
    option: Readonly<HelpOption>,
    maxLabelWidth: number,
    styles: Readonly<HelpStyles>
): string {
    const argument = getHelpOptionArgument(option);
    const plainArgument = argument === undefined ? "" : ` ${argument}`;
    const styledArgument =
        argument === undefined ? "" : ` ${styles.arg(argument)}`;
    const plainLabel = `${option.flag}${plainArgument}`;
    const styledLabel = `${styles.flag(option.flag)}${styledArgument}`;
    const spacing = " ".repeat(maxLabelWidth - plainLabel.length + 2);
    return `    ${styledLabel}${spacing}${option.description}`;
}

function renderHelpSection(
    section: Readonly<HelpSection>,
    maxLabelWidth: number,
    styles: Readonly<HelpStyles>
): readonly string[] {
    const options = section.options ?? [];
    return [
        styles.heading(`  ${section.title}:`),
        ...options.map((option) =>
            renderHelpOption(option, maxLabelWidth, styles)
        ),
        "",
    ];
}

function styleCommandExample(command: string, styler?: Styler): string {
    if (styler === undefined) {
        return command;
    }

    return command
        .split(/(?<spacing>\s+)/v)
        .map((token) => styleToken(token, styler))
        .join("");
}

function styleToken(token: string, styler: Styler): string {
    if (token.startsWith("--")) return styler.flag(token);
    if (token.startsWith("<") && token.endsWith(">")) return styler.arg(token);
    return token;
}
