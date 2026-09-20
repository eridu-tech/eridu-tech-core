// main.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: ({ text }) => text("Hello Deno!"),
});

Deno.serve((request) => router.fetch(request));
