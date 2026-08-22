import sharedConfig from "prettier-config-nick2bad4u";

const config = {
    ...sharedConfig,
    overrides: sharedConfig.overrides?.map((override) => ({
        ...override,
        options:
            override.options === undefined
                ? undefined
                : { ...override.options },
    })),
    plugins: [...(sharedConfig.plugins ?? [])],
};

export default config;
