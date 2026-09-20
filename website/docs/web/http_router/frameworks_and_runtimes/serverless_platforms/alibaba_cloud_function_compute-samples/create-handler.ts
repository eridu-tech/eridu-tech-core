// src/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";
import { handle } from "hono-alibaba-cloud-fc3-adapter";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: ({ text }) => text("Hello Alibaba Cloud!"),
});

export const handler = handle(router);
