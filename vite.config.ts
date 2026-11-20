import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        forceRerunTriggers: ["./src/**/*"],
        exclude: [
            "./package.json",
            "./.changeset/**",
            "./.github/**",
            "./.vscode/**",
            "./dist/**",
            "./docs/**",
            "./node_modules/**",
            "./website/**",
            "./.eslintignore",
            "./.eslintrc.json",
            "./.gitattributes",
            "./.gitignore",
            "./.prettierignore",
            "./.prettierrc.json",
            "./.CHANGELOG.md",
            "./LICENSE.md",
            "./README.md",
            "./tsconfig.base.json",
            "./tsconfig.build.json",
            "./tsconfig.json",
            "./typedoc.json",
        ],
    },
});
