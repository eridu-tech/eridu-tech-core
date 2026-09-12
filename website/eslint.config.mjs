import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            ".docusaurus/**",
            "build/**",
            "node_modules/**",
            "og-assets/**",
            "static/**",
        ],
    },

    // Base JS rules.
    js.configs.recommended,

    // typescript-eslint's shared configs are not file-scoped, so restrict them
    // to TypeScript files — otherwise type-aware rules run on plain `.mjs`
    // scripts and fail for lack of type information.
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files: config.files ?? ["**/*.{ts,tsx,mts,cts}"],
    })),

    {
        files: ["**/*.{ts,tsx,mts,cts}"],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // `async` is often required to match an interface signature even
            // when there is nothing to await.
            "@typescript-eslint/require-await": "off",
            // Method references are frequently passed as callbacks, and `this`
            // is never relied on in this codebase.
            "@typescript-eslint/unbound-method": "off",
        },
    },

    {
        files: ["**/*.{js,jsx,mjs,cjs}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: { ...globals.node, ...globals.browser },
        },
    },

    // React / JSX.
    {
        ...react.configs.flat.recommended,
        files: ["**/*.{jsx,tsx}"],
    },
    {
        ...react.configs.flat["jsx-runtime"],
        files: ["**/*.{jsx,tsx}"],
    },
    {
        files: ["**/*.{jsx,tsx}"],
        settings: { react: { version: "detect" } },
        rules: {
            // Props are already typed by TypeScript.
            "react/prop-types": "off",
        },
    },

    // React hooks (React code only — plain `.ts` files are not React).
    {
        ...reactHooks.configs.flat.recommended,
        files: ["**/*.{jsx,tsx}"],
    },

    // Documentation samples: unused variables/imports are usually intentional
    // in illustrative snippets, so don't flag them.
    {
        files: ["docs/**/*.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },

    // Turn off stylistic rules that conflict with Prettier, then run Prettier
    // as a lint rule. Prettier picks up the repo root `.prettierrc.json`.
    prettierConfig,
    {
        files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
        plugins: { prettier: prettierPlugin },
        rules: { "prettier/prettier": "error" },
    },
);
