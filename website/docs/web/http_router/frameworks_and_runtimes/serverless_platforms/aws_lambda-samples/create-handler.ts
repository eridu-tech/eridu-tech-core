// lambda/index.ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";
import { handle } from "hono/aws-lambda";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/hello",
    method: "GET",
    handler: ({ text }) => text("Hello AWS Lambda!"),
});

export const handler = handle(router);
