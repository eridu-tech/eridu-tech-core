import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import type { APIEvent } from "@solidjs/start/server";

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

export const GET = ({ request }: APIEvent) => router.fetch(request);
export const HEAD = ({ request }: APIEvent) => router.fetch(request);
export const POST = ({ request }: APIEvent) => router.fetch(request);
export const PUT = ({ request }: APIEvent) => router.fetch(request);
export const DELETE = ({ request }: APIEvent) => router.fetch(request);
export const PATCH = ({ request }: APIEvent) => router.fetch(request);
export const OPTIONS = ({ request }: APIEvent) => router.fetch(request);
