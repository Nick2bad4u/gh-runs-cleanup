import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        clearMocks: true,
        coverage: {
            exclude: ["src/cli-types.ts"],
            include: ["src/**/*.ts"],
            provider: "v8",
            reporter: [
                "text",
                "json-summary",
                "lcov",
                "cobertura",
            ],
            reportsDirectory: "coverage",
            thresholds: {
                branches: 90,
                functions: 90,
                lines: 90,
                statements: 90,
            },
        },
        environment: "node",
        include: ["test/**/*.test.ts"],
        restoreMocks: true,
        slowTestThreshold: 1000,
    },
});
