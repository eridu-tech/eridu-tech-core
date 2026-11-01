import { describe, expect, test, vi } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/derivables/_module-exports.js";
import { toHttpMiddleware } from "@/http-router/implementations/middlewares/to-http-middleware/to-http-middleware.js";
import {
    withAfterHook,
    withBeforeHook,
    withOnError,
} from "@/middleware/implementations/_module-exports.js";

import type {
    HttpHandlerIncomingArgs,
    HttpMiddlewareFn,
    IHttpRes,
} from "@/http-router/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";

type ConvertibleMiddleware = MiddlewareFn<
    [HttpHandlerIncomingArgs],
    Promise<IHttpRes>
>;

const USER = contextToken<string>("USER");

function createRouter(): HttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.endpoint({
        url: "/other",
        method: ["GET"],
        handler: ({ text }) => text("other"),
    });
    return router;
}

function fetchPath(router: HttpRouter, path: string): Promise<Response> {
    return router.fetch(new Request(`https://example.com${path}`));
}

describe("function: toHttpMiddleware", () => {
    describe("When registered as router middleware", () => {
        test("Should run before and after the endpoint handler", async () => {
            const order: Array<string> = [];
            const middleware: ConvertibleMiddleware = async (args) => {
                order.push("before");
                const response = await args.next();
                order.push("after");
                return response;
            };
            const router = createRouter();
            router.use(toHttpMiddleware(middleware));
            router.endpoint({
                url: "/wrapped",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("ok");
                },
            });

            const response = await fetchPath(router, "/wrapped");

            expect(order).toEqual(["before", "handler", "after"]);
            expect(await response.text()).toBe("ok");
        });
        test("Should allow the middleware to modify the response built by the handler", async () => {
            const middleware: ConvertibleMiddleware = async (args) => {
                const response = await args.next();
                return response.setHeader("X-Converted", "yes");
            };
            const router = createRouter();
            router.use(toHttpMiddleware(middleware));
            router.endpoint({
                url: "/modified",
                method: ["GET"],
                handler: ({ text }) => text("body"),
            });

            const response = await fetchPath(router, "/modified");

            expect(response.headers.get("x-converted")).toBe("yes");
            expect(await response.text()).toBe("body");
        });
        test("Should give the middleware the request and the shared context", async () => {
            const seen: Array<string> = [];
            const middleware: ConvertibleMiddleware = ({
                args: [incoming],
                next,
            }) => {
                seen.push(`${incoming.req.method} ${incoming.req.url}`);
                incoming.context.put(USER, "converted");
                return next();
            };
            const router = createRouter();
            router.use(toHttpMiddleware(middleware));
            router.endpoint({
                url: "/context",
                method: ["GET"],
                handler: ({ context, text }) => text(context.get(USER) ?? ""),
            });

            const response = await fetchPath(router, "/context");

            expect(seen).toEqual(["GET https://example.com/context"]);
            expect(await response.text()).toBe("converted");
        });
        test("Should respond with 500 when the middleware throws", async () => {
            const middleware: ConvertibleMiddleware = () => {
                throw new Error("middleware failure");
            };
            const router = createRouter();
            router.use(toHttpMiddleware(middleware));
            router.endpoint({
                url: "/failing-middleware",
                method: ["GET"],
                handler: ({ text }) => text("handler ran"),
            });

            const response = await fetchPath(router, "/failing-middleware");

            expect(response.status).toBe(500);
        });
    });

    describe("When registered as endpoint middleware", () => {
        test("Should only run for the endpoint it is registered on", async () => {
            const middleware: ConvertibleMiddleware = async (args) => {
                const response = await args.next();
                return response.setHeader("X-Endpoint", "yes");
            };
            const converted = vi.fn(toHttpMiddleware(middleware));
            const router = createRouter();
            router.endpoint({
                url: "/scoped",
                method: ["GET"],
                handler: ({ text }) => text("scoped"),
                middlewares: (builder) => builder.use(converted),
            });

            const scoped = await fetchPath(router, "/scoped");
            const other = await fetchPath(router, "/other");

            expect(converted).toHaveBeenCalledTimes(1);
            expect(scoped.headers.get("x-endpoint")).toBe("yes");
            expect(other.headers.get("x-endpoint")).toBeNull();
        });
    });

    describe("When several converted middlewares are registered", () => {
        test("Should run them in registration order around the handler", async () => {
            const order: Array<string> = [];
            const router = createRouter();
            const record = (label: string): HttpMiddlewareFn => {
                const middleware: ConvertibleMiddleware = async (args) => {
                    order.push(`${label}:before`);
                    const response = await args.next();
                    order.push(`${label}:after`);
                    return response;
                };
                return toHttpMiddleware(middleware);
            };
            router.use(record("first"));
            router.use(record("second"));
            router.endpoint({
                url: "/onion",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("ok");
                },
            });

            await fetchPath(router, "/onion");

            expect(order).toEqual([
                "first:before",
                "second:before",
                "handler",
                "second:after",
                "first:after",
            ]);
        });
    });

    describe("When the middleware is an invocable object", () => {
        test("Should call its `invoke` method", async () => {
            const invoke = vi.fn(
                (middlewareArgs: {
                    args: [HttpHandlerIncomingArgs];
                    next: () => Promise<IHttpRes>;
                }) => middlewareArgs.next(),
            );
            const router = createRouter();
            router.use(toHttpMiddleware({ invoke }));
            router.endpoint({
                url: "/object",
                method: ["GET"],
                handler: ({ text }) => text("object"),
            });

            const response = await fetchPath(router, "/object");

            expect(invoke).toHaveBeenCalledTimes(1);
            expect(await response.text()).toBe("object");
        });
    });

    describe("When the middleware comes from the middleware module", () => {
        test("Should run a `withBeforeHook` middleware before the handler", async () => {
            const before = vi.fn();
            const router = createRouter();
            router.use(
                toHttpMiddleware(
                    withBeforeHook<[HttpHandlerIncomingArgs], IHttpRes>(before),
                ),
            );
            router.endpoint({
                url: "/before-hook",
                method: ["GET"],
                handler: ({ text }) => text("ok"),
            });

            await fetchPath(router, "/before-hook");

            expect(before).toHaveBeenCalledTimes(1);
            expect(before.mock.calls[0]?.[0]).toHaveLength(1);
        });
        test("Should let a `withAfterHook` middleware replace the response", async () => {
            const router = createRouter();
            router.use(
                toHttpMiddleware(
                    withAfterHook<[HttpHandlerIncomingArgs], IHttpRes>(
                        (_args, response) => {
                            return response.setHeader("X-After-Hook", "yes");
                        },
                    ),
                ),
            );
            router.endpoint({
                url: "/after-hook",
                method: ["GET"],
                handler: ({ text }) => text("ok"),
            });

            const response = await fetchPath(router, "/after-hook");

            expect(response.headers.get("x-after-hook")).toBe("yes");
        });
        test("Should run a `withOnError` middleware when the handler throws", async () => {
            const onError = vi.fn();
            const router = createRouter();
            router.use(
                toHttpMiddleware(
                    withOnError<[HttpHandlerIncomingArgs], IHttpRes>(onError),
                ),
            );
            router.endpoint({
                url: "/on-error",
                method: ["GET"],
                handler: () => {
                    throw new Error("handler failure");
                },
            });

            const response = await fetchPath(router, "/on-error");

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError.mock.calls[0]?.[1]).toBeInstanceOf(Error);
            expect(response.status).toBe(500);
        });
    });

    describe("When driven through an `HttpRouter`", () => {
        test("Should pass the name of the middleware in `MiddlewareArgs`", async () => {
            const names: Array<string> = [];
            const middleware: ConvertibleMiddleware = function namedMiddleware({
                name,
                next,
            }) {
                names.push(name);
                return next();
            };
            const router = createRouter();
            router.use(toHttpMiddleware(middleware));
            router.endpoint({
                url: "/named",
                method: ["GET"],
                handler: ({ text }) => text("ok"),
            });

            await fetchPath(router, "/named");

            expect(names).toEqual(["namedMiddleware"]);
        });
        test("Should ignore arguments passed to the converted `next`", async () => {
            const middleware: ConvertibleMiddleware = (args) =>
                args.next([{} as HttpHandlerIncomingArgs]);
            const router = createRouter();
            router.use(toHttpMiddleware(middleware));
            router.endpoint({
                url: "/ignored-args",
                method: ["GET"],
                handler: ({ req, text }) => text(req.url),
            });

            const response = await fetchPath(router, "/ignored-args");

            expect(await response.text()).toBe(
                "https://example.com/ignored-args",
            );
        });
        test("Should resolve with the response built by the endpoint handler", async () => {
            const middleware: ConvertibleMiddleware = (args) => args.next();
            const router = createRouter();
            router.use(toHttpMiddleware(middleware));
            router.endpoint({
                url: "/passthrough",
                method: ["GET"],
                handler: ({ json }) => json({ ok: true }),
            });

            const response = await fetchPath(router, "/passthrough");

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ ok: true });
        });
    });
});
