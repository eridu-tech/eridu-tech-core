// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: ({ text }) => text("Hello Cloudflare Workers!"),
});

export default { fetch: (request: Request) => router.fetch(request) };
