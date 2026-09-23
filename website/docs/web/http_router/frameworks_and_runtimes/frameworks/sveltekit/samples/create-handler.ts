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

const handler = ({ request }: { request: Request }) => {
    return router.fetch(request);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
