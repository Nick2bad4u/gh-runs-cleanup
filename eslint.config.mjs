import { createConfig } from "eslint-config-nick2bad4u";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...createConfig({
        plugins: {
            "docusaurus-2": false,
            typefest: false,
        },
        tsconfigPaths: ["./tsconfig.json"],
    }),
    {
        name: "Repository policy exceptions",
        rules: {
            "repo-compliance/require-secret-scanning-config": "off",
        },
    },
    {
        files: ["**/*.ts"],
        name: "Require native Node TypeScript import extensions",
        rules: {
            "import-x/extensions": "off",
        },
    },
    {
        files: ["**/*.html"],
        name: "Defer self-closing tag spacing to Prettier",
        rules: {
            "@html-eslint/no-extra-spacing-tags": "off",
        },
    },
    {
        files: ["src/**/*.ts"],
        name: "Allow the CLI runtime to write user-facing output",
        rules: {
            "no-console": "off",
            "unicorn/prefer-error-is-error": "off",
        },
    },
    {
        files: ["src/cli-styling.ts"],
        name: "Allow terminal behavior to honor standard environment variables",
        rules: {
            "n/no-process-env": "off",
        },
    },
    {
        files: ["src/cli-output.ts"],
        name: "Keep ISO timestamp parsing compatible with supported Node LTS releases",
        rules: {
            "canonical/no-use-extend-native": "off",
            "unicorn/prefer-temporal": "off",
        },
    },
    {
        files: ["src/cli-gh.ts"],
        name: "Allow the synchronous GitHub CLI boundary",
        rules: {
            "n/no-sync": "off",
            "sonarjs/no-os-command-from-path": "off",
        },
    },
    {
        files: ["src/cli.ts"],
        name: "Allow the executable module to export its testable entry point",
        rules: {
            "unicorn/no-exports-in-scripts": "off",
        },
    },
    {
        files: ["test/**/*.ts"],
        name: "Keep deterministic test fixtures and cleanup readable",
        rules: {
            "canonical/no-barrel-import": "off",
            "sonarjs/no-undefined-assignment": "off",
            "test-signal/no-duplicate-assertions": "off",
            "test-signal/no-mock-call-only-tests": "off",
            "test-signal/require-negative-path": "off",
            "unicorn/prefer-temporal": "off",
            "vitest/no-hooks": "off",
            "vitest/prefer-import-in-mock": "off",
            "vitest/require-top-level-describe": "off",
        },
    },
];

export default config;
