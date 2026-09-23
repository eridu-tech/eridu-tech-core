// src/index.ts
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { serve } from "@hono/node-server";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
    baseUrl: "/api",
});

router.endpoint({
    url: "/hello/:name?",
    method: ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    handler: (args) => {
        const { name } = args.req.params();
        return args.text(
            [
                `METHOD: ${args.req.method},`,
                "Hello from Next.js",
                name ?? "",
                "!",
            ]
                .filter((str) => str !== "")
                .join(" ")
                .trim(),
        );
    },
});

const server = serve({
    fetch: (request: Request) => router.fetch(request),
    port: 3000,
});

// Graceful shutdown
process.on("SIGINT", () => {
    server.close();
    process.exit(0);
});
process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
});
