import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";

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

export const GET = async (request: Request) => router.fetch(request);
export const HEAD = async (request: Request) => router.fetch(request);
export const POST = async (request: Request) => router.fetch(request);
export const PUT = async (request: Request) => router.fetch(request);
export const DELETE = async (request: Request) => router.fetch(request);
export const PATCH = async (request: Request) => router.fetch(request);
export const OPTIONS = async (request: Request) => router.fetch(request);
