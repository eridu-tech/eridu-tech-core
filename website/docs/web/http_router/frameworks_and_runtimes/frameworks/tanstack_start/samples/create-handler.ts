/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { createFileRoute } from "@tanstack/react-router";

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

const handler = async ({ request }: { request: Request }) => {
    return router.fetch(request);
};
export const Route = createFileRoute("/api/$")({
    server: {
        handlers: {
            GET: handler,
            HEAD: handler,
            POST: handler,
            PUT: handler,
            DELETE: handler,
            PATCH: handler,
            OPTIONS: handler,
        },
    },
});
