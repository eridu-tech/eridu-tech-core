import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        tags: [
            {
                name: "Postgres",
                description: "All Postgres tests",
            },
            {
                name: "Mongodb",
                description: "All Mongodb tests",
            },
            {
                name: "Redis",
                description: "All Redis tests",
            },
            {
                name: "Memory",
                description: "All Memory tests",
            },
        ],
    },
});
