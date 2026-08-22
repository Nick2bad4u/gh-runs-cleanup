import sharedConfig from "stylelint-config-nick2bad4u";

/** @type {import("stylelint").Config} */
const stylelintConfig = {
    ...sharedConfig,
    rules: {
        ...sharedConfig.rules,
        // Named grid lines add noise to this small, presentation-only layout.
        "defensive-css/require-named-grid-lines": null,
        // This is a standalone static site, not a Docusaurus app.
        "docusaurus/no-color-scheme-on-docusaurus-html-root": null,
        "docusaurus/no-unscoped-content-element-overrides": null,
        // Component states intentionally follow their base selectors in this file.
        "no-descending-specificity": null,
        // Merging unrelated components solely because declarations match couples them.
        "plugin/stylelint-group-selectors": null,
    },
};

export default stylelintConfig;
