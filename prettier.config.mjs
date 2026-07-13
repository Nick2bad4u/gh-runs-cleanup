import sharedConfig from "prettier-config-nick2bad4u";

export default {
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
