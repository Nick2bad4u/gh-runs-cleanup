import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: ["node_modules/**", "temp/**", ".cache/**"],
    },
    js.configs.recommended,
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
