import { describe, expect, test, vi } from "vitest";

import { use } from "@/http-router/implementations/middlewares/use/use.js";

import type { WinterTcRequestHandler } from "@/http-router/contracts/_module-exports.js";

function createRequest(): Request {
    return new Request("https://example.com/test");
}

describe("function: use", () => {
    test("Should invoke the core handler when no middleware is provided", async () => {
        const request = createRequest();
        const core = vi.fn((): Promise<Response> => {
            return Promise.resolve(new Response("ok"));
        });

        const handler = use(core, []);

        const response = await handler(request);

        expect(core).toHaveBeenCalledExactlyOnceWith(request);
        expect(await response.text()).toBe("ok");
    });

    test("Should run middleware before and after the core handler", async () => {
        const order: Array<string> = [];
        const core: WinterTcRequestHandler = () => {
            order.push("core");
            return Promise.resolve(new Response("ok"));
        };
        const middleware = (
            request: Request,
            next: WinterTcRequestHandler,
        ): Promise<Response> => {
            order.push("before");
            return next(request).then((response) => {
                order.push("after");
                return response;
            });
        };

        const handler = use(core, middleware);

        await handler(createRequest());

        expect(order).toEqual(["before", "core", "after"]);
    });

    test("Should apply multiple middlewares in the order they are provided", async () => {
        const order: Array<string> = [];
        const createMiddleware = (name: string) => {
            return (
                request: Request,
                next: WinterTcRequestHandler,
            ): Promise<Response> => {
                order.push(`${name}-before`);
                return next(request).then((response) => {
                    order.push(`${name}-after`);
                    return response;
                });
            };
        };
        const core: WinterTcRequestHandler = () => {
            order.push("core");
            return Promise.resolve(new Response("ok"));
        };

        const handler = use(core, [
            createMiddleware("first"),
            createMiddleware("second"),
        ]);

        await handler(createRequest());

        expect(order).toEqual([
            "first-before",
            "second-before",
            "core",
            "second-after",
            "first-after",
        ]);
    });

    test("Should pass the request to the middleware and core handler", async () => {
        const request = createRequest();
        const middleware = vi.fn(
            (req: Request, next: WinterTcRequestHandler): Promise<Response> => {
                return next(req);
            },
        );
        const core = vi.fn((req: Request): Promise<Response> => {
            return Promise.resolve(new Response(req.url));
        });

        const handler = use(core, middleware);

        const response = await handler(request);

        expect(middleware).toHaveBeenCalledExactlyOnceWith(
            request,
            expect.any(Function) as WinterTcRequestHandler,
        );
        expect(core).toHaveBeenCalledExactlyOnceWith(request);
        expect(await response.text()).toBe(request.url);
    });

    test("Should allow middleware to short-circuit the chain", async () => {
        const core = vi.fn((): Promise<Response> => {
            return Promise.resolve(new Response("core"));
        });
        const middleware = (): Promise<Response> => {
            return Promise.resolve(new Response("short-circuit"));
        };

        const handler = use(core, middleware);

        const response = await handler(createRequest());

        expect(await response.text()).toBe("short-circuit");
        expect(core).not.toHaveBeenCalled();
    });

    test("Should allow middleware to modify the response", async () => {
        const middleware = (
            request: Request,
            next: WinterTcRequestHandler,
        ): Promise<Response> => {
            return next(request).then((response) => {
                return new Response(response.body, {
                    status: response.status,
                    headers: {
                        ...Object.fromEntries(response.headers.entries()),
                        "X-Test": "yes",
                    },
                });
            });
        };

        const handler = use(
            (): Promise<Response> => Promise.resolve(new Response("body")),
            middleware,
        );

        const response = await handler(createRequest());

        expect(response.headers.get("X-Test")).toBe("yes");
        expect(await response.text()).toBe("body");
    });
});
