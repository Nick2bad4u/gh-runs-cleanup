import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

import { createConfig } from "eslint-config-nick2bad4u";

const codeFiles = ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"];
const sharedConfig = createConfig();
const sharedRulesOff = Object.fromEntries(
    sharedConfig.flatMap((config) =>
        Object.keys(config.rules ?? {}).map((ruleName) => [ruleName, "off"])
    )
);

export default [
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "temp/**",
            ".cache/**",
        ],
    },
    ...sharedConfig,
    {
        name: "Preserve the repository's established ESLint rule contract",
        rules: sharedRulesOff,
    },
    {
        ...js.configs.recommended,
        files: codeFiles,
    },
    ...tseslint.configs.strict.map((config) => ({
        ...config,
        files: codeFiles,
    })),
    ...tseslint.configs.strictTypeChecked.map((config) => ({
        ...config,
        files: codeFiles,
    })),
    {
        files: ["**/*.{ts,mts,cts,tsx}"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ["**/*.{ts,mts,cts,tsx}"],
        rules: {
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
            "@typescript-eslint/no-confusing-void-expression": "error",
            "@typescript-eslint/no-unnecessary-condition": "error",
            "@typescript-eslint/no-unnecessary-template-expression": "error",
            "@typescript-eslint/restrict-template-expressions": [
                "error",
                {
                    allowAny: false,
                    allowBoolean: true,
                    allowNullish: false,
                    allowNumber: true,
                    allowRegExp: false,
                },
            ],
        },
    },
    {
        files: ["test/**/*.ts"],
        rules: { "@typescript-eslint/no-floating-promises": "off" },
    },
    {
        ...tseslint.configs.disableTypeChecked,
        files: ["**/*.{js,mjs,cjs}"],
    },
    {
        files: ["**/*.{js,mjs,cjs}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                ...globals.node,
            },
            sourceType: "module",
        },
        rules: {
            "no-console": "off",
        },
    },
];
