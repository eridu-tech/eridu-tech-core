/**
 * @module HttpRouter
 */

/*
 * The handler args expose stateless response helpers (`text`, `json`, ...) that are
 * documented to be destructured, and the router's route patterns are naturally typed
 * with array shorthand. Both are stylistic-only concerns in a test file.
 */
/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/array-type */

import { describe, expect, test } from "vitest";
import { z } from "zod";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { FileSize } from "@/file-size/implementations/_module.js";
import { HttpError } from "@/http-router/contracts/_module.js";
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@/http-router/implementations/http-router.js";

import type {
    IHttpRouter,
    WinterTcMiddleware,
    WinterTcRequestHandler,
} from "@/http-router/contracts/_module.js";
import type { HttpRouterSettings } from "@/http-router/implementations/http-router.js";

const USER = contextToken<string>("USER");
const REQUEST_ID = contextToken<string>("REQUEST_ID");

function createRouter(settings: Partial<HttpRouterSettings> = {}): IHttpRouter {
    return new HttpRouter({
        ...settings,
        router: settings.router ?? defaultHttpRouterAdapter(),
    });
}

function request(path: string, init?: RequestInit): Request {
    return new Request(`https://example.com${path}`, init);
}

async function readJson<TData>(response: Response): Promise<TData> {
    return (await response.json()) as TData;
}

function jsonRequest(path: string, body: unknown): Request {
    return request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

function uploadRequest(path: string, files: Record<string, File>): Request {
    const formData = new FormData();
    for (const [name, file] of Object.entries(files)) {
        formData.set(name, file);
    }
    return request(path, { method: "POST", body: formData });
}

function textFile(name = "doc.txt", content = "hello"): File {
    return new File([content], name, { type: "text/plain" });
}

describe("class: HttpRouter", () => {
    describe("constructor:", () => {
        test("Create a router with only the required router setting and dispatch requests using the default baseUrl of '/'", async () => {
            const instance = new HttpRouter({
                router: defaultHttpRouterAdapter(),
            });
            instance.endpoint({
                url: "/hello",
                method: ["GET"],
                handler: ({ text }) => text("hello"),
            });

            const response = await instance.fetch(request("/hello"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("hello");
        });
        test("Prefix every endpoint registered through endpoint() with the configured baseUrl so the request must include that prefix to match", async () => {
            const prefixed = createRouter({ baseUrl: "/api" });
            prefixed.endpoint({
                url: "/users",
                method: ["GET"],
                handler: ({ text }) => text("users"),
            });

            const matching = await prefixed.fetch(request("/api/users"));
            const unprefixed = await prefixed.fetch(request("/users"));

            expect(matching.status).toBe(200);
            expect(await matching.text()).toBe("users");
            expect(unprefixed.status).toBe(404);
        });
        test("Prefix endpoints registered inside a group with both the configured baseUrl and the group prefix", async () => {
            const prefixed = createRouter({ baseUrl: "/api" });
            prefixed.group("/v1", (v1) => {
                v1.endpoint({
                    url: "/ping",
                    method: ["GET"],
                    handler: ({ text }) => text("pong"),
                });
            });

            const response = await prefixed.fetch(request("/api/v1/ping"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("pong");
        });
        test("Normalize a baseUrl that contains leading or trailing slashes so that it behaves the same as its normalized form", async () => {
            const withSlashes = createRouter({ baseUrl: "/api/" });
            withSlashes.endpoint({
                url: "/users",
                method: ["GET"],
                handler: ({ text }) => text("users"),
            });

            const response = await withSlashes.fetch(request("/api/users"));

            expect(response.status).toBe(200);
        });
        test("Run a single WinterTC middleware passed through the middlewares setting before route matching for every incoming request", async () => {
            const seenPaths: string[] = [];
            const withMiddleware = createRouter({
                middlewares: (incoming, next) => {
                    seenPaths.push(new URL(incoming.url).pathname);
                    return next(incoming);
                },
            });
            withMiddleware.endpoint({
                url: "/watched",
                method: ["GET"],
                handler: ({ text }) => text("watched"),
            });

            const response = await withMiddleware.fetch(request("/watched"));

            expect(response.status).toBe(200);
            expect(seenPaths).toEqual(["/watched"]);
        });
        test("Run multiple WinterTC middlewares passed through the middlewares setting in registration order with the first registered running outermost", async () => {
            const order: string[] = [];
            const withMiddleware = createRouter({
                middlewares: [
                    async (incoming, next) => {
                        order.push("first-before");
                        const response = await next(incoming);
                        order.push("first-after");
                        return response;
                    },
                    async (incoming, next) => {
                        order.push("second-before");
                        const response = await next(incoming);
                        order.push("second-after");
                        return response;
                    },
                ],
            });
            withMiddleware.endpoint({
                url: "/ordered",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("ordered");
                },
            });

            await (await withMiddleware.fetch(request("/ordered"))).text();

            expect(order).toEqual([
                "first-before",
                "second-before",
                "handler",
                "second-after",
                "first-after",
            ]);
        });
        test("Accept an invocable middleware object through the middlewares setting and run it before route matching", async () => {
            let observed = false;
            const objectMiddleware = {
                invoke: async (
                    incoming: Request,
                    next: WinterTcRequestHandler,
                ): Promise<Response> => {
                    observed = true;
                    return await next(incoming);
                },
            };
            const withMiddleware = createRouter({
                middlewares: objectMiddleware as unknown as WinterTcMiddleware,
            });
            withMiddleware.endpoint({
                url: "/object",
                method: ["GET"],
                handler: ({ text }) => text("object"),
            });

            const response = await withMiddleware.fetch(request("/object"));

            expect(response.status).toBe(200);
            expect(observed).toBe(true);
        });
        test("Run constructor level middleware for requests that match no endpoint so the middleware can observe the request before a 404 is produced", async () => {
            const seenPaths: string[] = [];
            const withMiddleware = createRouter({
                middlewares: (incoming, next) => {
                    seenPaths.push(new URL(incoming.url).pathname);
                    return next(incoming);
                },
            });

            const response = await withMiddleware.fetch(request("/missing"));

            expect(response.status).toBe(404);
            expect(seenPaths).toEqual(["/missing"]);
        });
        test("Short-circuit route resolution when constructor level middleware returns a response without calling next", async () => {
            let handlerRan = false;
            const withMiddleware = createRouter({
                middlewares: () =>
                    Promise.resolve(new Response("blocked", { status: 403 })),
            });
            withMiddleware.endpoint({
                url: "/guarded",
                method: ["GET"],
                handler: ({ text }) => {
                    handlerRan = true;
                    return text("guarded");
                },
            });

            const response = await withMiddleware.fetch(request("/guarded"));

            expect(response.status).toBe(403);
            expect(await response.text()).toBe("blocked");
            expect(handlerRan).toBe(false);
        });
        test("Allow constructor level middleware to observe the response returned by next and modify it before it reaches the caller", async () => {
            const withMiddleware = createRouter({
                middlewares: async (incoming, next) => {
                    const response = await next(incoming);
                    response.headers.set("X-Observed", "yes");
                    return response;
                },
            });
            withMiddleware.endpoint({
                url: "/observed",
                method: ["GET"],
                handler: ({ text }) => text("observed"),
            });

            const response = await withMiddleware.fetch(request("/observed"));

            expect(response.headers.get("x-observed")).toBe("yes");
            expect(await response.text()).toBe("observed");
        });
        test("Allow constructor level middleware to pass a rewritten Request to next so that downstream routing uses the rewritten method or URL", async () => {
            const withMiddleware = createRouter({
                middlewares: async (incoming, next) => {
                    const rewritten = new URL(incoming.url);
                    rewritten.pathname = "/rewritten";
                    return await next(
                        new Request(rewritten, {
                            method: incoming.method,
                            headers: incoming.headers,
                        }),
                    );
                },
            });
            withMiddleware.endpoint({
                url: "/rewritten",
                method: ["GET"],
                handler: ({ text }) => text("rewritten"),
            });
            withMiddleware.endpoint({
                url: "/original",
                method: ["GET"],
                handler: ({ text }) => text("original"),
            });

            const response = await withMiddleware.fetch(request("/original"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("rewritten");
        });
        test("Return a 500 response when constructor level middleware throws a value that is not an HttpError", async () => {
            const withMiddleware = createRouter({
                middlewares: () => {
                    throw new Error("middleware boom");
                },
            });
            withMiddleware.endpoint({
                url: "/x",
                method: ["GET"],
                handler: ({ text }) => text("x"),
            });

            const response = await withMiddleware.fetch(request("/x"));

            expect(response.status).toBe(500);
            expect(await response.text()).toBe("Unexpected error occurred");
        });
        test("Return the HttpError status and JSON error body when constructor level middleware throws an HttpError", async () => {
            const withMiddleware = createRouter({
                middlewares: () => {
                    throw HttpError.create({
                        status: "418",
                        message: "teapot",
                    });
                },
            });
            withMiddleware.endpoint({
                url: "/x",
                method: ["GET"],
                handler: ({ text }) => text("x"),
            });

            const response = await withMiddleware.fetch(request("/x"));

            expect(response.status).toBe(418);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["name"]).toBe("HttpError");
            expect(body["status"]).toBe("418");
            expect(body["message"]).toBe("teapot");
        });
        test("Expose a fetch function matching the WinterTC Request to Response signature on every constructed instance", async () => {
            const instance = createRouter();

            const result: Promise<Response> = instance.fetch(request("/"));

            expect(typeof instance.fetch).toBe("function");
            expect(result).toBeInstanceOf(Promise);
            expect((await result).status).toBe(404);
        });
        test("Keep the middleware registrations of one router independent from the middleware registrations of another router instance", async () => {
            const seen: string[] = [];
            const withMiddleware = createRouter({
                middlewares: (incoming, next) => {
                    seen.push("middleware");
                    return next(incoming);
                },
            });
            const withoutMiddleware = createRouter();
            withMiddleware.endpoint({
                url: "/shared",
                method: ["GET"],
                handler: ({ text }) => text("shared"),
            });
            withoutMiddleware.endpoint({
                url: "/shared",
                method: ["GET"],
                handler: ({ text }) => text("shared"),
            });

            await (await withMiddleware.fetch(request("/shared"))).text();
            expect(seen).toEqual(["middleware"]);

            await (await withoutMiddleware.fetch(request("/shared"))).text();
            expect(seen).toEqual(["middleware"]);
        });
    });
    describe("method: use", () => {
        test("Register shared middleware that runs for every endpoint registered after the use call on the same router", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                seen.push("middleware");
                return await next();
            });
            instance.endpoint({
                url: "/a",
                method: ["GET"],
                handler: ({ text }) => text("a"),
            });
            instance.endpoint({
                url: "/b",
                method: ["GET"],
                handler: ({ text }) => text("b"),
            });

            await (await instance.fetch(request("/a"))).text();
            await (await instance.fetch(request("/b"))).text();

            expect(seen).toEqual(["middleware", "middleware"]);
        });
        test("Return a router base from use so that endpoint and group registrations can be chained directly after it", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance
                .use(async ({ next }) => {
                    seen.push("middleware");
                    return await next();
                })
                .group("/grouped", (grouped) => {
                    grouped.endpoint({
                        url: "/inside",
                        method: ["GET"],
                        handler: ({ text }) => text("inside"),
                    });
                });

            const response = await instance.fetch(request("/grouped/inside"));

            expect(response.status).toBe(200);
            expect(seen).toEqual(["middleware"]);
        });
        test("Accumulate middleware across multiple use calls and run them in registration order with the first registered outermost", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                order.push("first-before");
                const response = await next();
                order.push("first-after");
                return response;
            });
            instance.use(async ({ next }) => {
                order.push("second-before");
                const response = await next();
                order.push("second-after");
                return response;
            });
            instance.endpoint({
                url: "/ordered",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("ordered");
                },
            });

            await (await instance.fetch(request("/ordered"))).text();

            expect(order).toEqual([
                "first-before",
                "second-before",
                "handler",
                "second-after",
                "first-after",
            ]);
        });
        test("Run shared middleware before the matched endpoint handler", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                order.push("middleware");
                return await next();
            });
            instance.endpoint({
                url: "/x",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("x");
                },
            });

            await (await instance.fetch(request("/x"))).text();

            expect(order).toEqual(["middleware", "handler"]);
        });
        test("Run shared middleware before endpoint specific middleware and run both before the endpoint handler", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                order.push("shared");
                return await next();
            });
            instance.endpoint({
                url: "/x",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("x");
                },
                middlewares: (builder) =>
                    builder.use(async ({ next }) => {
                        order.push("endpoint-middleware");
                        return await next();
                    }),
            });

            await (await instance.fetch(request("/x"))).text();

            expect(order).toEqual(["shared", "endpoint-middleware", "handler"]);
        });
        test("Pass req, res, context, and next to shared middleware so it can inspect the request and continue the chain", async () => {
            const instance = createRouter();
            instance.use(async ({ req, res, context, next }) => {
                context.put(USER, "middleware-user");
                res.setHeader("X-Middleware", req.method);
                return await next();
            });
            instance.endpoint({
                url: "/inspect",
                method: ["GET"],
                handler: ({ context, json }) =>
                    json({ user: context.get(USER) }),
            });

            const response = await instance.fetch(request("/inspect"));

            expect(response.headers.get("x-middleware")).toBe("GET");
            expect(await readJson<{ user: string }>(response)).toEqual({
                user: "middleware-user",
            });
        });
        test("Stop the chain when shared middleware returns a response without calling next so later middleware and the handler are not invoked", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                order.push("first");
                return await next();
            });
            instance.use(({ res }) => {
                order.push("stopping");
                return res.setStatus(401).setBody("stop");
            });
            instance.endpoint({
                url: "/stopped",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("stopped");
                },
            });

            const response = await instance.fetch(request("/stopped"));

            expect(response.status).toBe(401);
            expect(await response.text()).toBe("stop");
            expect(order).toEqual(["first", "stopping"]);
        });
        test("Allow shared middleware to inspect the response returned by next and add headers or change the status before returning it", async () => {
            const instance = createRouter();
            instance.use(async ({ next }) => {
                const response = await next();
                response.setHeader("X-Added", "yes");
                response.setStatus(202);
                return response;
            });
            instance.endpoint({
                url: "/modified",
                method: ["GET"],
                handler: ({ text }) => text("modified"),
            });

            const response = await instance.fetch(request("/modified"));

            expect(response.status).toBe(202);
            expect(response.headers.get("x-added")).toBe("yes");
            expect(await response.text()).toBe("modified");
        });
        test("Allow shared middleware to reject a request with an error response based on request headers without invoking the handler", async () => {
            let handlerRan = false;
            const instance = createRouter();
            instance.use(async ({ req, res, next }) => {
                if (req.headers()["authorization"] === undefined) {
                    return res.setStatus(401).setBody("Unauthorized");
                }
                return await next();
            });
            instance.endpoint({
                url: "/protected",
                method: ["GET"],
                handler: ({ text }) => {
                    handlerRan = true;
                    return text("protected");
                },
            });

            const rejected = await instance.fetch(request("/protected"));
            expect(rejected.status).toBe(401);
            expect(await rejected.text()).toBe("Unauthorized");
            expect(handlerRan).toBe(false);

            const allowed = await instance.fetch(
                request("/protected", {
                    headers: { Authorization: "Bearer token" },
                }),
            );
            expect(allowed.status).toBe(200);
            expect(await allowed.text()).toBe("protected");
        });
        test("Run shared middleware for every HTTP method an endpoint is registered for", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                seen.push("middleware");
                return await next();
            });
            instance.endpoint({
                url: "/methods",
                method: ["GET", "POST"],
                handler: ({ text }) => text("methods"),
            });

            await (await instance.fetch(request("/methods"))).text();
            await (
                await instance.fetch(request("/methods", { method: "POST" }))
            ).text();

            expect(seen).toEqual(["middleware", "middleware"]);
        });
        test("Leave endpoints registered before the use call untouched so they do not run middleware registered afterwards", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.endpoint({
                url: "/before",
                method: ["GET"],
                handler: ({ text }) => text("before"),
            });
            instance.use(async ({ next }) => {
                seen.push("middleware");
                return await next();
            });
            instance.endpoint({
                url: "/after",
                method: ["GET"],
                handler: ({ text }) => text("after"),
            });

            await (await instance.fetch(request("/before"))).text();
            expect(seen).toEqual([]);

            await (await instance.fetch(request("/after"))).text();
            expect(seen).toEqual(["middleware"]);
        });
        test("Await asynchronous shared middleware before invoking the next middleware or the endpoint handler", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                await new Promise((resolve) => setTimeout(resolve, 5));
                order.push("middleware-finished");
                return await next();
            });
            instance.endpoint({
                url: "/async",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("async");
                },
            });

            await (await instance.fetch(request("/async"))).text();

            expect(order).toEqual(["middleware-finished", "handler"]);
        });
        test("Accept an invocable middleware object with an invoke method as shared middleware", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.use({
                invoke: async ({ next }) => {
                    seen.push("object-middleware");
                    return await next();
                },
            });
            instance.endpoint({
                url: "/object",
                method: ["GET"],
                handler: ({ text }) => text("object"),
            });

            const response = await instance.fetch(request("/object"));

            expect(response.status).toBe(200);
            expect(seen).toEqual(["object-middleware"]);
        });
        test("Run middleware registered with use on a parent router for endpoints registered inside a group", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                seen.push("root-middleware");
                return await next();
            });
            instance.group("/api", (api) => {
                api.endpoint({
                    url: "/users",
                    method: ["GET"],
                    handler: ({ text }) => text("users"),
                });
            });

            const response = await instance.fetch(request("/api/users"));

            expect(response.status).toBe(200);
            expect(seen).toEqual(["root-middleware"]);
        });
        test("Run middleware registered with use inside a group for endpoints registered inside that group and its nested groups", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.group("/api", (api) => {
                api.use(async ({ next }) => {
                    seen.push("group-middleware");
                    return await next();
                });
                api.endpoint({
                    url: "/users",
                    method: ["GET"],
                    handler: ({ text }) => text("users"),
                });
                api.group("/nested", (nested) => {
                    nested.endpoint({
                        url: "/deep",
                        method: ["GET"],
                        handler: ({ text }) => text("deep"),
                    });
                });
            });

            await (await instance.fetch(request("/api/users"))).text();
            await (await instance.fetch(request("/api/nested/deep"))).text();

            expect(seen).toEqual(["group-middleware", "group-middleware"]);
        });
        test("Register a middleware and an endpoint in a single chained expression through the returned router base", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance
                .use(async ({ next }) => {
                    seen.push("middleware");
                    return await next();
                })
                .endpoint({
                    url: "/chained",
                    method: ["GET"],
                    handler: ({ text }) => text("chained"),
                });

            const response = await instance.fetch(request("/chained"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("chained");
            expect(seen).toEqual(["middleware"]);
        });
    });
    describe("method: endpoint", () => {
        test("Register a GET route and invoke its handler when the request method and path both match", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/articles",
                method: ["GET"],
                handler: ({ text }) => text("articles"),
            });

            const response = await instance.fetch(request("/articles"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("articles");
        });
        test("Do not invoke the GET handler and instead return a 404 response when the request uses an unsupported HTTP method", async () => {
            let handlerRan = false;
            const instance = createRouter();
            instance.endpoint({
                url: "/get-only",
                method: ["GET"],
                handler: ({ text }) => {
                    handlerRan = true;
                    return text("get-only");
                },
            });

            const response = await instance.fetch(
                request("/get-only", { method: "POST" }),
            );

            expect(response.status).toBe(404);
            expect(handlerRan).toBe(false);
        });
        test("Register an endpoint for a single method name and invoke its handler only for that method", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/single",
                method: "GET",
                handler: ({ text }) => text("single"),
            });

            const get = await instance.fetch(request("/single"));
            const post = await instance.fetch(
                request("/single", { method: "POST" }),
            );

            expect(get.status).toBe(200);
            expect(post.status).toBe(404);
        });
        test("Register an endpoint for multiple methods and invoke the same handler for each of those methods", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/multi",
                method: ["GET", "POST"],
                handler: ({ req, text }) => text(req.method),
            });

            const get = await instance.fetch(request("/multi"));
            const post = await instance.fetch(
                request("/multi", { method: "POST" }),
            );
            const remove = await instance.fetch(
                request("/multi", { method: "DELETE" }),
            );

            expect(await get.text()).toBe("GET");
            expect(await post.text()).toBe("POST");
            expect(remove.status).toBe(404);
        });
        test("Register an endpoint without a method and invoke its handler for GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, and TRACE requests", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/any-method",
                handler: ({ text }) => text("any-method"),
            });

            const statuses: Record<string, number> = {};
            for (const method of [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "HEAD",
                "OPTIONS",
            ]) {
                statuses[method] = (
                    await instance.fetch(request("/any-method", { method }))
                ).status;
            }

            expect(statuses).toEqual({
                GET: 200,
                POST: 200,
                PUT: 200,
                PATCH: 200,
                DELETE: 200,
                HEAD: 200,
                OPTIONS: 200,
            });
        });
        test("Register an endpoint with a custom HTTP method such as PURGE and invoke its handler for that method", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/cache",
                method: ["PURGE"],
                handler: ({ text }) => text("purged"),
            });

            const purge = await instance.fetch(
                request("/cache", { method: "PURGE" }),
            );
            const get = await instance.fetch(request("/cache"));

            expect(purge.status).toBe(200);
            expect(await purge.text()).toBe("purged");
            expect(get.status).toBe(404);
        });
        test("Register a handler defined as an invocable object with an invoke method and invoke it for matching requests", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/object-handler",
                method: ["GET"],
                handler: {
                    invoke: ({ text }) => text("object-handler"),
                },
            });

            const response = await instance.fetch(request("/object-handler"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("object-handler");
        });
        test("Return a router base from endpoint so that further registrations can be chained", async () => {
            const instance = createRouter();
            instance
                .endpoint({
                    url: "/first",
                    method: ["GET"],
                    handler: ({ text }) => text("first"),
                })
                .endpoint({
                    url: "/second",
                    method: ["GET"],
                    handler: ({ text }) => text("second"),
                });

            expect((await instance.fetch(request("/first"))).status).toBe(200);
            expect((await instance.fetch(request("/second"))).status).toBe(200);
        });
        test("Register multiple endpoints and route each request to the handler whose URL pattern and method match", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/alpha",
                method: ["GET"],
                handler: ({ text }) => text("alpha"),
            });
            instance.endpoint({
                url: "/beta",
                method: ["GET"],
                handler: ({ text }) => text("beta"),
            });

            expect(await (await instance.fetch(request("/alpha"))).text()).toBe(
                "alpha",
            );
            expect(await (await instance.fetch(request("/beta"))).text()).toBe(
                "beta",
            );
        });
        test("Register the same URL for different methods and route each request to the handler registered for its method", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/resource",
                method: ["GET"],
                handler: ({ text }) => text("read"),
            });
            instance.endpoint({
                url: "/resource",
                method: ["POST"],
                handler: ({ text }) => text("write"),
            });

            const read = await instance.fetch(request("/resource"));
            const write = await instance.fetch(
                request("/resource", { method: "POST" }),
            );

            expect(await read.text()).toBe("read");
            expect(await write.text()).toBe("write");
        });
        test("Invoke the matching handler exactly once when the same method and URL pattern are registered more than once", async () => {
            let firstCount = 0;
            let secondCount = 0;
            const instance = createRouter();
            instance.endpoint({
                url: "/duplicate",
                method: ["GET"],
                handler: ({ text }) => {
                    firstCount += 1;
                    return text("first");
                },
            });
            instance.endpoint({
                url: "/duplicate",
                method: ["GET"],
                handler: ({ text }) => {
                    secondCount += 1;
                    return text("second");
                },
            });

            const response = await instance.fetch(request("/duplicate"));

            expect(response.status).toBe(200);
            expect(firstCount + secondCount).toBe(1);
        });
        test("Expose req, res, context, and the response helper functions as handler arguments", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/arguments",
                method: ["GET"],
                handler: ({ req, res, context, json, text, html }) => {
                    res.setHeader("X-Method", req.method);
                    context.put(REQUEST_ID, "abc");
                    return json({
                        hasText: typeof text,
                        hasHtml: typeof html,
                        requestId: context.get(REQUEST_ID),
                    });
                },
            });

            const response = await instance.fetch(request("/arguments"));

            expect(response.headers.get("x-method")).toBe("GET");
            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                hasText: "function",
                hasHtml: "function",
                requestId: "abc",
            });
        });
        test("Extract a single path parameter from the matched URL and expose it through req.params()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/users/:id",
                method: ["GET"],
                handler: ({ json, req }) => json({ params: req.params() }),
            });

            const response = await instance.fetch(request("/users/42"));

            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: { id: "42" },
            });
        });
        test("Extract multiple path parameters from the matched URL and expose every one of them through req.params()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/users/:userId/posts/:postId",
                method: ["GET"],
                handler: ({ json, req }) => json({ params: req.params() }),
            });

            const response = await instance.fetch(request("/users/7/posts/99"));

            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: { userId: "7", postId: "99" },
            });
        });
        test("Match a route with an optional parameter both with and without the optional path segment", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/animals/:type?",
                method: ["GET"],
                handler: ({ json, req }) => json({ params: req.params() }),
            });

            const withParam = await instance.fetch(request("/animals/dog"));
            const withoutParam = await instance.fetch(request("/animals"));

            expect(withParam.status).toBe(200);
            expect(withoutParam.status).toBe(200);
            expect(
                await readJson<{ params: Record<string, string> }>(withParam),
            ).toEqual({ params: { type: "dog" } });
            expect(
                await readJson<{ params: Record<string, string> }>(
                    withoutParam,
                ),
            ).toEqual({ params: {} });
        });
        test("Expose the captured value of a wildcard path segment through req.params()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/wild/*/card",
                method: ["GET"],
                handler: ({ json, req }) => json({ params: req.params() }),
            });

            const response = await instance.fetch(
                request("/wild/anything/card"),
            );

            expect(response.status).toBe(200);
            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: {},
            });
        });
        test("Match a wildcard segment only when exactly one path segment sits between the surrounding fixed segments", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/wild/*/card",
                method: ["GET"],
                handler: ({ text }) => text("card"),
            });

            const single = await instance.fetch(request("/wild/anything/card"));
            const multiple = await instance.fetch(request("/wild/a/b/card"));

            expect(single.status).toBe(200);
            expect(multiple.status).toBe(404);
        });
        test("Expose the decoded value of a percent-encoded path parameter through req.params()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/files/:name",
                method: ["GET"],
                handler: ({ json, req }) => json({ params: req.params() }),
            });

            const response = await instance.fetch(request("/files/a%20b"));

            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: { name: "a%20b" },
            });
        });
        test("Match a regex-constrained parameter only when the segment satisfies the pattern and return 404 otherwise", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/post/:date{[0-9]+}",
                method: ["GET"],
                handler: ({ json, req }) => json({ params: req.params() }),
            });

            const matching = await instance.fetch(request("/post/2024"));
            const failing = await instance.fetch(request("/post/not-a-date"));

            expect(matching.status).toBe(200);
            expect(await readJson<{ params: unknown }>(matching)).toEqual({
                params: { date: "2024" },
            });
            expect(failing.status).toBe(404);
        });
        test("Match a regex-constrained parameter whose pattern permits slashes and expose the captured value", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/assets/:path{.+}",
                method: ["GET"],
                handler: ({ json, req }) => json({ params: req.params() }),
            });

            const response = await instance.fetch(
                request("/assets/css/site.css"),
            );

            expect(response.status).toBe(200);
            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: { path: "css/site.css" },
            });
        });
        test("Prefer the more specific route over a wildcard route when a request path matches both", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/precedence/*",
                method: ["GET"],
                handler: ({ text }) => text("wildcard"),
            });
            instance.endpoint({
                url: "/precedence/exact",
                method: ["GET"],
                handler: ({ text }) => text("exact"),
            });

            const response = await instance.fetch(request("/precedence/exact"));

            expect(await response.text()).toBe("wildcard");
        });
        test("Extract path parameters for an endpoint registered inside a group using the full prefixed path", async () => {
            const instance = createRouter();
            instance.group("/api", (api) => {
                api.endpoint({
                    url: "/users/:id",
                    method: ["GET"],
                    handler: ({ json, req }) => json({ params: req.params() }),
                });
            });

            const response = await instance.fetch(request("/api/users/5"));

            expect(response.status).toBe(200);
            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: { id: "5" },
            });
        });
        test("Return a 404 response when a path segment required by the URL pattern is missing from the request", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/users/:id",
                method: ["GET"],
                handler: ({ text }) => text("user"),
            });

            const response = await instance.fetch(request("/users"));

            expect(response.status).toBe(404);
        });
        test("Match a trailing slash variant of a registered path the same way as the canonical path", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/canonical",
                method: ["GET"],
                handler: ({ text }) => text("canonical"),
            });

            const canonical = await instance.fetch(request("/canonical"));
            const withTrailingSlash = await instance.fetch(
                request("/canonical/"),
            );

            expect(canonical.status).toBe(200);
            expect(withTrailingSlash.status).toBe(200);
        });
        test("Expose the request method and full URL through req.method and req.url", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/inspect-request",
                method: ["GET"],
                handler: ({ json, req }) =>
                    json({ method: req.method, url: req.url }),
            });

            const response = await instance.fetch(
                request("/inspect-request?page=2"),
            );

            expect(
                await readJson<{ method: string; url: string }>(response),
            ).toEqual({
                method: "GET",
                url: "https://example.com/inspect-request?page=2",
            });
        });
        test("Expose repeated query parameters as an array and single query parameters as a string through req.searchParams()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/search",
                method: ["GET"],
                handler: ({ json, req }) =>
                    json({
                        searchParams: req.searchParams(),
                    }),
            });

            const response = await instance.fetch(
                request("/search?tag=a&tag=b&page=1"),
            );

            expect(await readJson<{ searchParams: unknown }>(response)).toEqual(
                {
                    searchParams: { tag: ["a", "b"], page: "1" },
                },
            );
        });
        test("Expose request headers through req.headers() using header names that are insensitive to casing", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/headers",
                method: ["GET"],
                handler: ({ json, req }) => json({ headers: req.headers() }),
            });

            const response = await instance.fetch(
                request("/headers", {
                    headers: { "X-Custom-Header": "value" },
                }),
            );

            const body = await readJson<{
                headers: Record<string, string>;
            }>(response);
            expect(body.headers["x-custom-header"]).toBe("value");
        });
        test("Parse the Cookie header and expose every cookie through req.cookies()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/cookies",
                method: ["GET"],
                handler: ({ json, req }) => json({ cookies: req.cookies() }),
            });

            const response = await instance.fetch(
                request("/cookies", {
                    headers: { Cookie: "session=abc123; theme=dark" },
                }),
            );

            expect(await readJson<{ cookies: unknown }>(response)).toEqual({
                cookies: { session: "abc123", theme: "dark" },
            });
        });
        test("Expose the parsed JSON request body through req.json()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/json",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({ body: await req.json() }),
            });

            const response = await instance.fetch(
                jsonRequest("/json", { key: "value" }),
            );

            expect(await readJson<{ body: unknown }>(response)).toEqual({
                body: { key: "value" },
            });
        });
        test("Validate the JSON request body against a schema passed to req.json() and return the validated value", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/json-schema",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({
                        body: await req.json(
                            z.object({ age: z.coerce.number() }),
                        ),
                    }),
            });

            const response = await instance.fetch(
                jsonRequest("/json-schema", { age: "31" }),
            );

            expect(await readJson<{ body: unknown }>(response)).toEqual({
                body: { age: 31 },
            });
        });
        test("Return a 400 HttpError response listing the issues when the JSON body fails schema validation", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/json-fail",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({
                        body: await req.json(z.object({ name: z.string() })),
                    }),
            });

            const response = await instance.fetch(
                jsonRequest("/json-fail", { name: 123 }),
            );

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["name"]).toBe("HttpError");
            expect(body["status"]).toBe("400");
            expect(Array.isArray(body["payload"])).toBe(true);
        });
        test("Return a 400 HttpError response listing the issues when path parameters fail schema validation", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/params-fail/:id",
                method: ["GET"],
                handler: ({ json, req }) =>
                    json({
                        id: req.params(z.object({ id: z.string().min(2) })),
                    }),
            });

            const response = await instance.fetch(request("/params-fail/1"));

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
            expect(Array.isArray(body["payload"])).toBe(true);
        });
        test("Return a 400 HttpError response listing the issues when request headers fail schema validation", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/headers-fail",
                method: ["GET"],
                handler: ({ json, req }) =>
                    json({
                        auth: req.headers(
                            z.object({ authorization: z.string() }),
                        ),
                    }),
            });

            const response = await instance.fetch(request("/headers-fail"));

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
            expect(Array.isArray(body["payload"])).toBe(true);
        });
        test("Return a 400 HttpError response listing the issues when cookies fail schema validation", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/cookies-fail",
                method: ["GET"],
                handler: ({ json, req }) =>
                    json({
                        session: req.cookies(z.object({ session: z.string() })),
                    }),
            });

            const response = await instance.fetch(request("/cookies-fail"));

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
            expect(Array.isArray(body["payload"])).toBe(true);
        });
        test("Return a 400 HttpError response listing the issues when search parameters fail schema validation", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/search-fail",
                method: ["GET"],
                handler: ({ json, req }) =>
                    json({
                        page: req.searchParams(z.object({ page: z.string() })),
                    }),
            });

            const response = await instance.fetch(request("/search-fail"));

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
            expect(Array.isArray(body["payload"])).toBe(true);
        });
        test("Expose form fields through req.fields() including repeated field names as arrays", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/fields",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({ fields: await req.fields() }),
            });

            const formData = new FormData();
            formData.append("tag", "a");
            formData.append("tag", "b");
            formData.set("title", "hello");
            const response = await instance.fetch(
                request("/fields", { method: "POST", body: formData }),
            );

            expect(await readJson<{ fields: unknown }>(response)).toEqual({
                fields: { tag: ["a", "b"], title: "hello" },
            });
        });
        test("Return a 400 HttpError response listing the issues when form fields fail schema validation", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/fields-fail",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({
                        fields: await req.fields(
                            z.object({ title: z.string() }),
                        ),
                    }),
            });

            const formData = new FormData();
            formData.set("other", "value");
            const response = await instance.fetch(
                request("/fields-fail", { method: "POST", body: formData }),
            );

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
            expect(Array.isArray(body["payload"])).toBe(true);
        });
        test("Expose uploaded files through req.files() as file collections keyed by the file field name", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/upload",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files();
                    const collection = files["doc"];
                    if (collection === undefined) {
                        return json({ missing: true });
                    }
                    return json({
                        size: collection.size(),
                        name: collection.first()?.name ?? null,
                        text: await collection.first()?.asText(),
                        contentType: collection.first()?.contentType ?? null,
                    });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/upload", { doc: textFile() }),
            );

            expect(response.status).toBe(200);
            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                size: 1,
                name: "doc.txt",
                text: "hello",
                contentType: "text/plain",
            });
        });
        test("Expose only the file fields declared in the schema passed to req.files()", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/declared-files",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({
                        doc: { contentType: "text/plain" },
                    });
                    return json({ fields: Object.keys(files) });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/declared-files", {
                    doc: textFile(),
                    extra: textFile("extra.txt"),
                }),
            );

            expect(await readJson<{ fields: string[] }>(response)).toEqual({
                fields: ["doc"],
            });
        });
        test("Return a 400 HttpError response when an uploaded file exceeds the maximum size declared in the file definition", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/max-size",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({
                        doc: { fileSize: FileSize.fromBytes(2) },
                    });
                    return json({ fields: Object.keys(files) });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/max-size", { doc: textFile() }),
            );

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
        });
        test("Return a 400 HttpError response when an uploaded file content type does not match the declared content type", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/max-type",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({
                        doc: { contentType: "application/pdf" },
                    });
                    return json({ fields: Object.keys(files) });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/max-type", { doc: textFile() }),
            );

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
        });
        test("Return a 400 HttpError response when an uploaded file name does not match the declared name pattern", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/name-pattern",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({
                        doc: { name: /^report-.*\.pdf$/u },
                    });
                    return json({ fields: Object.keys(files) });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/name-pattern", { doc: textFile() }),
            );

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
        });
        test("Return a 400 HttpError response when more files are uploaded than the declared maximum", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/max-files",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({ doc: { max: 1 } });
                    return json({ fields: Object.keys(files) });
                },
            });

            const formData = new FormData();
            formData.append("doc", textFile("one.txt"));
            formData.append("doc", textFile("two.txt"));
            const response = await instance.fetch(
                request("/max-files", { method: "POST", body: formData }),
            );

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
        });
        test("Return a 400 HttpError response when fewer files are uploaded than the declared minimum", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/min-files",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({ doc: { min: 2 } });
                    return json({ fields: Object.keys(files) });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/min-files", { doc: textFile() }),
            );

            expect(response.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(response);
            expect(body["status"]).toBe("400");
        });
        test("Return a 400 HttpError response when a required file is missing and accept the request when the field is optional", async () => {
            const required = createRouter();
            required.endpoint({
                url: "/required-file",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({ doc: {} });
                    return json({ fields: Object.keys(files) });
                },
            });
            const optional = createRouter();
            optional.endpoint({
                url: "/optional-file",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({ doc: { optional: true } });
                    return json({ fields: Object.keys(files) });
                },
            });

            const empty = new FormData();
            empty.set("other", "value");
            const requiredResponse = await required.fetch(
                request("/required-file", { method: "POST", body: empty }),
            );
            const optionalResponse = await optional.fetch(
                request("/optional-file", { method: "POST", body: empty }),
            );

            expect(requiredResponse.status).toBe(400);
            expect(
                await readJson<Record<string, unknown>>(requiredResponse),
            ).toMatchObject({ status: "400" });
            expect(optionalResponse.status).toBe(200);
        });
        test("Support a dynamic file definition that inspects the uploaded collection and returns an error message or null", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/dynamic-file",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files({
                        doc: (collection) =>
                            collection.size() > 1
                                ? "Only one file is allowed"
                                : null,
                    });
                    return json({ fields: Object.keys(files) });
                },
            });

            const single = await instance.fetch(
                uploadRequest("/dynamic-file", { doc: textFile() }),
            );
            const formData = new FormData();
            formData.append("doc", textFile("one.txt"));
            formData.append("doc", textFile("two.txt"));
            const multiple = await instance.fetch(
                request("/dynamic-file", { method: "POST", body: formData }),
            );

            expect(single.status).toBe(200);
            expect(multiple.status).toBe(400);
            const body = await readJson<Record<string, unknown>>(multiple);
            expect(body["message"]).toBe("Only one file is allowed");
        });
        test("Read the request body as text, bytes, ArrayBuffer, and Blob through the corresponding req readers", async () => {
            const asText = createRouter();
            asText.endpoint({
                url: "/read-text",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({ value: await req.text() }),
            });
            const asBytes = createRouter();
            asBytes.endpoint({
                url: "/read-bytes",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({ value: [...(await req.bytes())] }),
            });
            const asArrayBuffer = createRouter();
            asArrayBuffer.endpoint({
                url: "/read-array-buffer",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({
                        value: new TextDecoder().decode(
                            await req.arrayBuffer(),
                        ),
                    }),
            });
            const asBlob = createRouter();
            asBlob.endpoint({
                url: "/read-blob",
                method: ["POST"],
                handler: async ({ json, req }) =>
                    json({ value: await (await req.blob()).text() }),
            });

            const body = { method: "POST", body: "abc" };
            expect(
                await readJson<{ value: string }>(
                    await asText.fetch(request("/read-text", body)),
                ),
            ).toEqual({ value: "abc" });
            expect(
                await readJson<{ value: number[] }>(
                    await asBytes.fetch(request("/read-bytes", body)),
                ),
            ).toEqual({ value: [97, 98, 99] });
            expect(
                await readJson<{ value: string }>(
                    await asArrayBuffer.fetch(
                        request("/read-array-buffer", body),
                    ),
                ),
            ).toEqual({ value: "abc" });
            expect(
                await readJson<{ value: string }>(
                    await asBlob.fetch(request("/read-blob", body)),
                ),
            ).toEqual({ value: "abc" });
        });
        test("Expose a streamed request body through req.readableStream", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/stream-request",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const stream = req.readableStream;
                    if (stream === null) {
                        return json({ total: 0 });
                    }
                    let total = 0;
                    for await (const chunk of stream) {
                        total += (chunk as Uint8Array).length;
                    }
                    return json({ total });
                },
            });

            const response = await instance.fetch(
                request("/stream-request", { method: "POST", body: "abcd" }),
            );

            expect(await readJson<{ total: number }>(response)).toEqual({
                total: 4,
            });
        });
        test("Iterate the request body chunks through the async iterator exposed on req", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/iterate-request",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    let total = 0;
                    for await (const chunk of req) {
                        total += (chunk as Uint8Array).length;
                    }
                    return json({ total });
                },
            });

            const response = await instance.fetch(
                request("/iterate-request", { method: "POST", body: "abcd" }),
            );

            expect(await readJson<{ total: number }>(response)).toEqual({
                total: 4,
            });
        });
        test("Expose the underlying Web API Request through req.webReq", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/web-request",
                method: ["POST"],
                handler: ({ json, req }) =>
                    json({
                        isRequest: req.webReq instanceof Request,
                        method: req.webReq.method,
                        url: req.webReq.url,
                    }),
            });

            const response = await instance.fetch(
                request("/web-request", { method: "POST", body: "x" }),
            );

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                isRequest: true,
                method: "POST",
                url: "https://example.com/web-request",
            });
        });
        test("Expose the AbortSignal of the underlying request through req.signal", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/signal",
                method: ["GET"],
                handler: ({ json, req }) =>
                    json({
                        isSignal: req.signal instanceof AbortSignal,
                        aborted: req.signal.aborted,
                    }),
            });

            const response = await instance.fetch(request("/signal"));

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                isSignal: true,
                aborted: false,
            });
        });
        test("Read the size, indexed file, first file, and emptiness from a file collection and iterate it", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/collection",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const collection = (await req.files())["doc"];
                    if (collection === undefined) {
                        return json({ missing: true });
                    }
                    return json({
                        size: collection.size(),
                        isEmpty: collection.isEmpty(),
                        indexed: collection.get(0)?.name ?? null,
                        outOfBounds: collection.get(9),
                        first: collection.first()?.name ?? null,
                        iterated: [...collection].map((file) => file.name),
                    });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/collection", { doc: textFile() }),
            );

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                size: 1,
                isEmpty: false,
                indexed: "doc.txt",
                outOfBounds: null,
                first: "doc.txt",
                iterated: ["doc.txt"],
            });
        });
        test("Throw a 400 HttpError from getOrFail when the requested file index does not exist and return the first file from firstOrFail", async () => {
            const getOrFail = createRouter();
            getOrFail.endpoint({
                url: "/get-or-fail",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const collection = (await req.files())["doc"];
                    if (collection === undefined) {
                        return json({ missing: true });
                    }
                    return json({ name: collection.getOrFail(9).name });
                },
            });
            const firstOrFail = createRouter();
            firstOrFail.endpoint({
                url: "/first-or-fail",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files();
                    const collection = files["doc"];
                    if (collection === undefined) {
                        return json({ missing: true });
                    }
                    return json({ name: collection.firstOrFail().name });
                },
            });

            const getResponse = await getOrFail.fetch(
                uploadRequest("/get-or-fail", { doc: textFile() }),
            );
            const firstResponse = await firstOrFail.fetch(
                uploadRequest("/first-or-fail", { doc: textFile() }),
            );

            expect(getResponse.status).toBe(400);
            expect(
                await readJson<Record<string, unknown>>(getResponse),
            ).toMatchObject({ status: "400" });
            expect(firstResponse.status).toBe(200);
            expect(await readJson<{ name: string }>(firstResponse)).toEqual({
                name: "doc.txt",
            });
        });
        test("Read the uploaded file content as text, bytes, ArrayBuffer, and a readable stream and expose its name, content type, size, and last modified date", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/file-access",
                method: ["POST"],
                handler: async ({ json, req }) => {
                    const files = await req.files();
                    const file = files["doc"]?.first() ?? null;
                    if (file === null) {
                        return json({});
                    }
                    let streamed = 0;
                    for await (const chunk of file.asReadableStream()) {
                        streamed += chunk.length;
                    }
                    return json({
                        text: await file.asText(),
                        bytes: [...(await file.asBytes())],
                        arrayBuffer: new TextDecoder().decode(
                            await file.asArrayBuffer(),
                        ),
                        streamed,
                        name: file.name,
                        contentType: file.contentType,
                        fileSize: file.fileSize.toBytes(),
                        lastModified: file.lastModified instanceof Date,
                        asFile: file.asFile() instanceof File,
                    });
                },
            });

            const response = await instance.fetch(
                uploadRequest("/file-access", { doc: textFile() }),
            );

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                text: "hello",
                bytes: [104, 101, 108, 108, 111],
                arrayBuffer: "hello",
                streamed: 5,
                name: "doc.txt",
                contentType: "text/plain",
                fileSize: 5,
                lastModified: true,
                asFile: true,
            });
        });
        test("Set the response status, status text, body, and arbitrary headers through the response builder and observe them on the returned Response", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/builder",
                method: ["GET"],
                handler: ({ res }) =>
                    res
                        .setStatus(201)
                        .setStatusText("Created")
                        .setHeader("X-Custom", "value")
                        .setBody("created"),
            });

            const response = await instance.fetch(request("/builder"));

            expect(response.status).toBe(201);
            expect(response.statusText).toBe("Created");
            expect(response.headers.get("x-custom")).toBe("value");
            expect(await response.text()).toBe("created");
        });
        test("Stream a response body provided as an async iterable through the returned Response", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/stream-response",
                method: ["GET"],
                handler: ({ res }) =>
                    res.setBody(
                        (async function* generate() {
                            await Promise.resolve();
                            yield new TextEncoder().encode("chunk-one");
                            yield new TextEncoder().encode("chunk-two");
                        })(),
                    ),
            });

            const response = await instance.fetch(request("/stream-response"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("chunk-onechunk-two");
        });
        test("Set the Content-Type, Content-Length, Content-Encoding, Content-Language, Content-Disposition, Content-Range, Cache-Control, ETag, and Location headers through their dedicated setters", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/headers-builder",
                method: ["GET"],
                handler: ({ res }) =>
                    res
                        .setContentType("text/plain")
                        .setContentLength(4)
                        .setContentEncoding("gzip")
                        .setContentLanguage("en")
                        .setContentDisposition("inline")
                        .setContentRange("bytes 0-3/4")
                        .setCacheControl("no-store")
                        .setETag('"abc"')
                        .setLocation("/elsewhere")
                        .setBody("body"),
            });

            const response = await instance.fetch(request("/headers-builder"));

            expect(response.headers.get("content-type")).toBe("text/plain");
            expect(response.headers.get("content-length")).toBe("4");
            expect(response.headers.get("content-encoding")).toBe("gzip");
            expect(response.headers.get("content-language")).toBe("en");
            expect(response.headers.get("content-disposition")).toBe("inline");
            expect(response.headers.get("content-range")).toBe("bytes 0-3/4");
            expect(response.headers.get("cache-control")).toBe("no-store");
            expect(response.headers.get("etag")).toBe('"abc"');
            expect(response.headers.get("location")).toBe("/elsewhere");
        });
        test("Append a value to an existing response header so both values are present on the returned Response", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/append-header",
                method: ["GET"],
                handler: ({ res }) =>
                    res
                        .setHeader("X-Multi", "first")
                        .appendHeader("X-Multi", "second")
                        .setBody("body"),
            });

            const response = await instance.fetch(request("/append-header"));

            const value = response.headers.get("x-multi") ?? "";
            expect(value).toContain("first");
            expect(value).toContain("second");
        });
        test("Read back a previously set header through getHeader and receive null for a header that was never set", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/get-header",
                method: ["GET"],
                handler: ({ json, res }) => {
                    res.setHeader("X-Set", "value");
                    return json({
                        set: res.getHeader("X-Set"),
                        unset: res.getHeader("X-Unset"),
                    });
                },
            });

            const response = await instance.fetch(request("/get-header"));

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                set: "value",
                unset: null,
            });
        });
        test("Return a text/plain Response containing the given body from the text response helper", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/text-helper",
                method: ["GET"],
                handler: ({ text }) => text("plain text"),
            });

            const response = await instance.fetch(request("/text-helper"));

            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toBe("text/plain");
            expect(await response.text()).toBe("plain text");
        });
        test("Return a text/html Response containing the given body from the html response helper", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/html-helper",
                method: ["GET"],
                handler: ({ html }) => html("<h1>Hello</h1>"),
            });

            const response = await instance.fetch(request("/html-helper"));

            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toBe("text/html");
            expect(await response.text()).toBe("<h1>Hello</h1>");
        });
        test("Return an application/json Response containing the serialized value from the json response helper", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/json-helper",
                method: ["GET"],
                handler: ({ json }) => json({ nested: { value: 1 } }),
            });

            const response = await instance.fetch(request("/json-helper"));

            expect(response.status).toBe(200);
            expect(response.headers.get("content-type")).toBe(
                "application/json",
            );
            expect(await readJson<unknown>(response)).toEqual({
                nested: { value: 1 },
            });
        });
        test("Validate the value passed to the json response helper against the provided schema before serializing it", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/json-output-schema",
                method: ["GET"],
                handler: ({ json }) =>
                    json(
                        { name: "  spaced  " },
                        z.object({ name: z.string().trim() }),
                    ),
            });

            const response = await instance.fetch(
                request("/json-output-schema"),
            );

            expect(response.status).toBe(200);
            expect(await readJson<unknown>(response)).toEqual({
                name: "spaced",
            });
        });
        test("Surface an error response when the json response helper is given content that fails its output schema", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/json-output-schema-fail",
                method: ["GET"],
                handler: ({ json }) =>
                    json({ count: 1 }, z.object({ count: z.number().min(5) })),
            });

            const response = await instance.fetch(
                request("/json-output-schema-fail"),
            );

            expect(response.status).toBe(500);
        });
        test("Return a 404 Response with body 'Not found' and Content-Type text/html from the notFound response helper", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/not-found-helper",
                method: ["GET"],
                handler: ({ notFound }) => notFound(),
            });

            const response = await instance.fetch(request("/not-found-helper"));

            expect(response.status).toBe(404);
            expect(response.headers.get("content-type")).toBe("text/html");
            expect(await response.text()).toBe("Not found");
        });
        test("Return a 302 Response with the Location header from the redirect response helper", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/redirect-helper",
                method: ["GET"],
                handler: ({ redirect }) => redirect("/target"),
            });

            const response = await instance.fetch(request("/redirect-helper"));

            expect(response.status).toBe(302);
            expect(response.headers.get("location")).toBe("/target");
        });
        test("Return a 301 Response with the Location header from the permanentRedirect response helper", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/permanent-redirect-helper",
                method: ["GET"],
                handler: ({ permanentRedirect }) =>
                    permanentRedirect("/target"),
            });

            const response = await instance.fetch(
                request("/permanent-redirect-helper"),
            );

            expect(response.status).toBe(301);
            expect(response.headers.get("location")).toBe("/target");
        });
        test("Wrap an existing Web API Response with fromWebRes and preserve its status, headers, and body", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/from-web-res",
                method: ["GET"],
                handler: ({ fromWebRes }) =>
                    fromWebRes(
                        new Response("wrapped", {
                            status: 418,
                            headers: { "X-Original": "yes" },
                        }),
                    ),
            });

            const response = await instance.fetch(request("/from-web-res"));

            expect(response.status).toBe(418);
            expect(response.headers.get("x-original")).toBe("yes");
            expect(await response.text()).toBe("wrapped");
        });
        test("Set a cookie through putCookie and observe the configured attributes on the emitted Set-Cookie header", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/set-cookie",
                method: ["GET"],
                handler: ({ res }) => {
                    res.putCookie("session", "abc", {
                        httpOnly: true,
                        secure: true,
                        sameSite: "Strict",
                        maxAge: 3600,
                        domain: "example.com",
                        path: "/",
                        priority: "High",
                    });
                    return res.setBody("done");
                },
            });

            const response = await instance.fetch(request("/set-cookie"));
            const header = response.headers.get("set-cookie") ?? "";

            expect(header).toContain("session=abc");
            expect(header).toContain("Max-Age=3600");
            expect(header).toContain("Domain=example.com");
            expect(header).toContain("Path=/");
            expect(header).toContain("Secure");
            expect(header).toContain("HttpOnly");
            expect(header).toContain("SameSite=Strict");
            expect(header).toContain("Priority=High");
        });
        test("Update an existing cookie through putCookie without emitting duplicate Set-Cookie entries for the same cookie name", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/update-cookie",
                method: ["GET"],
                handler: ({ res }) => {
                    res.putCookie("session", "first");
                    res.putCookie("session", "second");
                    return res.setBody("done");
                },
            });

            const response = await instance.fetch(request("/update-cookie"));

            expect(response.headers.get("set-cookie")).toBe(
                "session=second; SameSite=Lax",
            );
        });
        test("Expire a cookie through removeCookie and observe a Set-Cookie header with Max-Age=0 and an expiry in the past", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/remove-cookie",
                method: ["GET"],
                handler: ({ res }) => {
                    res.putCookie("session", "abc");
                    res.removeCookie("session");
                    return res.setBody("done");
                },
            });

            const response = await instance.fetch(request("/remove-cookie"));
            const header = response.headers.get("set-cookie") ?? "";

            expect(header).toContain("session=");
            expect(header).toContain("Max-Age=0");
            expect(header).toContain("Expires=");
        });
        test("Strip every Set-Cookie header with withoutCookies() and only the named cookie with withoutCookies(name)", async () => {
            const named = createRouter();
            named.endpoint({
                url: "/strip-named",
                method: ["GET"],
                handler: ({ res }) => {
                    res.putCookie("keep", "1");
                    res.putCookie("drop", "2");
                    res.withoutCookies("drop");
                    return res.setBody("done");
                },
            });
            const all = createRouter();
            all.endpoint({
                url: "/strip-all",
                method: ["GET"],
                handler: ({ res }) => {
                    res.putCookie("keep", "1");
                    res.withoutCookies();
                    return res.setBody("done");
                },
            });

            const namedResponse = await named.fetch(request("/strip-named"));
            const allResponse = await all.fetch(request("/strip-all"));

            expect(namedResponse.headers.get("set-cookie")).toBe(
                "keep=1; SameSite=Lax",
            );
            expect(allResponse.headers.get("set-cookie")).toBeNull();
        });
        test("Report cookie presence through hasCookies() for any cookie and through hasCookies(name) for a specific cookie", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/has-cookies",
                method: ["GET"],
                handler: ({ json, res }) => {
                    const before = res.hasCookies();
                    res.putCookie("present", "1");
                    return json({
                        before,
                        any: res.hasCookies(),
                        present: res.hasCookies("present"),
                        missing: res.hasCookies("missing"),
                    });
                },
            });

            const response = await instance.fetch(request("/has-cookies"));

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                before: false,
                any: true,
                present: true,
                missing: false,
            });
        });
        test("Apply the secure and host cookie name prefixes together with the partitioned, priority, sameSite, secure, httpOnly, domain, path, expires, and maxAge settings to the emitted Set-Cookie header", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/cookie-settings",
                method: ["GET"],
                handler: ({ res }) => {
                    res.putCookie("secure-cookie", "1", {
                        prefix: "secure",
                        secure: true,
                    });
                    res.putCookie("host-cookie", "2", {
                        prefix: "host",
                        secure: true,
                        path: "/",
                    });
                    res.putCookie("partitioned-cookie", "3", {
                        partitioned: true,
                        sameSite: "None",
                        priority: "Low",
                    });
                    return res.setBody("done");
                },
            });

            const response = await instance.fetch(request("/cookie-settings"));
            const header = response.headers.get("set-cookie") ?? "";

            expect(header).toContain("__Secure-secure-cookie=1; Secure");
            expect(header).toContain("__Host-host-cookie=2; Path=/; Secure");
            expect(header).toContain(
                "partitioned-cookie=3; SameSite=None; Priority=Low; Partitioned",
            );
        });
        test("Run endpoint-specific middleware registered through the endpoint middlewares builder before the endpoint handler", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.endpoint({
                url: "/endpoint-middleware",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("done");
                },
                middlewares: (builder) =>
                    builder.use(async ({ next }) => {
                        order.push("middleware");
                        return await next();
                    }),
            });

            const response = await instance.fetch(
                request("/endpoint-middleware"),
            );

            expect(response.status).toBe(200);
            expect(order).toEqual(["middleware", "handler"]);
        });
        test("Run shared middleware registered with use before endpoint-specific middleware", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                order.push("shared");
                return await next();
            });
            instance.endpoint({
                url: "/ordering",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("done");
                },
                middlewares: (builder) =>
                    builder.use(async ({ next }) => {
                        order.push("endpoint-specific");
                        return await next();
                    }),
            });

            await (await instance.fetch(request("/ordering"))).text();

            expect(order).toEqual(["shared", "endpoint-specific", "handler"]);
        });
        test("Run endpoint-specific middleware in the order it was registered through the builder", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.endpoint({
                url: "/middleware-order",
                method: ["GET"],
                handler: ({ json }) => {
                    order.push("handler");
                    return json({ order });
                },
                middlewares: (builder) =>
                    builder
                        .use(async ({ next }) => {
                            order.push("first");
                            return await next();
                        })
                        .use(async ({ next }) => {
                            order.push("second");
                            return await next();
                        }),
            });

            await (await instance.fetch(request("/middleware-order"))).text();

            expect(order).toEqual(["first", "second", "handler"]);
        });
        test("Short-circuit endpoint processing when endpoint middleware returns an error response without calling next", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.endpoint({
                url: "/middleware-stop",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("handler");
                },
                middlewares: (builder) =>
                    builder.use(({ res }) => {
                        order.push("middleware");
                        return res.setStatus(403).setBody("forbidden");
                    }),
            });

            const response = await instance.fetch(request("/middleware-stop"));

            expect(response.status).toBe(403);
            expect(await response.text()).toBe("forbidden");
            expect(order).toEqual(["middleware"]);
        });
        test("Allow endpoint middleware to modify the response returned by next before it is returned to the caller", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/middleware-modify",
                method: ["GET"],
                handler: ({ text }) => text("modified"),
                middlewares: (builder) =>
                    builder.use(async ({ next }) => {
                        const response = await next();
                        response.setHeader("X-Modified", "yes");
                        return response;
                    }),
            });

            const response = await instance.fetch(
                request("/middleware-modify"),
            );

            expect(response.headers.get("x-modified")).toBe("yes");
            expect(await response.text()).toBe("modified");
        });
        test("Share the same context and response builder between endpoint middleware and the endpoint handler of one request", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/shared-state",
                method: ["GET"],
                handler: ({ context, json, res }) =>
                    json({
                        user: context.get(USER),
                        header: res.getHeader("X-From-Middleware"),
                    }),
                middlewares: (builder) =>
                    builder.use(async ({ context, next, res }) => {
                        context.put(USER, "endpoint-user");
                        res.setHeader("X-From-Middleware", "yes");
                        return await next();
                    }),
            });

            const response = await instance.fetch(request("/shared-state"));

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                user: "endpoint-user",
                header: "yes",
            });
        });
        test("Accept an invocable middleware object through the endpoint middlewares builder", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.endpoint({
                url: "/object-middleware",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("done");
                },
                middlewares: (builder) =>
                    builder.use({
                        invoke: async ({ next }) => {
                            order.push("object-middleware");
                            return await next();
                        },
                    }),
            });

            const response = await instance.fetch(
                request("/object-middleware"),
            );

            expect(response.status).toBe(200);
            expect(order).toEqual(["object-middleware", "handler"]);
        });
        test("Await asynchronous endpoint middleware before invoking the endpoint handler", async () => {
            const order: string[] = [];
            const instance = createRouter();
            instance.endpoint({
                url: "/async-middleware",
                method: ["GET"],
                handler: ({ text }) => {
                    order.push("handler");
                    return text("done");
                },
                middlewares: (builder) =>
                    builder.use(async ({ next }) => {
                        await new Promise((resolve) => setTimeout(resolve, 5));
                        order.push("middleware-finished");
                        return await next();
                    }),
            });

            await (await instance.fetch(request("/async-middleware"))).text();

            expect(order).toEqual(["middleware-finished", "handler"]);
        });
        test("Expose a request-scoped context to middleware and handlers that persists values along the middleware chain and into the handler", async () => {
            const instance = createRouter();
            instance.use(async ({ context, next }) => {
                context.put(REQUEST_ID, "req-1");
                return await next();
            });
            instance.endpoint({
                url: "/context",
                method: ["GET"],
                handler: ({ context, json }) =>
                    json({ requestId: context.get(REQUEST_ID) }),
            });

            const response = await instance.fetch(request("/context"));

            expect(await readJson<Record<string, unknown>>(response)).toEqual({
                requestId: "req-1",
            });
        });
        test("Isolate the execution context between sequential requests so values stored during the first request are not visible during the second", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/isolated-context",
                method: ["GET"],
                handler: ({ context, json }) => {
                    const before = context.get(REQUEST_ID);
                    context.put(REQUEST_ID, "stored");
                    return json({ before });
                },
            });

            const first = await instance.fetch(request("/isolated-context"));
            const second = await instance.fetch(request("/isolated-context"));

            expect(await readJson<{ before: unknown }>(first)).toEqual({
                before: null,
            });
            expect(await readJson<{ before: unknown }>(second)).toEqual({
                before: null,
            });
        });
    });
    describe("method: group", () => {
        test("Prefix endpoints registered inside group(prefix, fn) with the given prefix so requests must include it to match", async () => {
            const instance = createRouter();
            instance.group("/api", (api) => {
                api.endpoint({
                    url: "/users",
                    method: ["GET"],
                    handler: ({ text }) => text("users"),
                });
            });

            const inside = await instance.fetch(request("/api/users"));
            const outside = await instance.fetch(request("/users"));

            expect(inside.status).toBe(200);
            expect(outside.status).toBe(404);
        });
        test("Register endpoints inside group(fn) without an additional prefix so they keep the router current prefix", async () => {
            const instance = createRouter();
            instance.group((sub) => {
                sub.endpoint({
                    url: "/nested",
                    method: ["GET"],
                    handler: ({ text }) => text("nested"),
                });
            });

            const response = await instance.fetch(request("/nested"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("nested");
        });
        test("Combine the prefixes of nested groups so an endpoint registered in a nested group matches the full concatenated path", async () => {
            const instance = createRouter();
            instance.group("/v1", (v1) => {
                v1.group("/users", (users) => {
                    users.endpoint({
                        url: "/:id",
                        method: ["GET"],
                        handler: ({ json, req }) =>
                            json({ params: req.params() }),
                    });
                });
            });

            const response = await instance.fetch(request("/v1/users/3"));

            expect(response.status).toBe(200);
            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: { id: "3" },
            });
        });
        test("Inherit the outer prefix when a nested group is registered without its own prefix", async () => {
            const instance = createRouter();
            instance.group("/api", (api) => {
                api.group((nested) => {
                    nested.endpoint({
                        url: "/inherited",
                        method: ["GET"],
                        handler: ({ text }) => text("inherited"),
                    });
                });
            });

            const response = await instance.fetch(request("/api/inherited"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("inherited");
        });
        test("Combine the configured baseUrl with the group prefix for endpoints registered inside a group", async () => {
            const instance = createRouter({ baseUrl: "/api" });
            instance.group("/v1", (v1) => {
                v1.endpoint({
                    url: "/ping",
                    method: ["GET"],
                    handler: ({ text }) => text("pong"),
                });
            });

            const full = await instance.fetch(request("/api/v1/ping"));
            const partial = await instance.fetch(request("/v1/ping"));

            expect(full.status).toBe(200);
            expect(partial.status).toBe(404);
        });
        test("Return a router base from group so that endpoint, use, and group registrations can be chained", async () => {
            const instance = createRouter();
            instance
                .group("/one", (one) => {
                    one.endpoint({
                        url: "/a",
                        method: ["GET"],
                        handler: ({ text }) => text("a"),
                    });
                })
                .endpoint({
                    url: "/two",
                    method: ["GET"],
                    handler: ({ text }) => text("two"),
                })
                .group("/three", (three) => {
                    three.endpoint({
                        url: "/b",
                        method: ["GET"],
                        handler: ({ text }) => text("b"),
                    });
                });

            expect((await instance.fetch(request("/one/a"))).status).toBe(200);
            expect((await instance.fetch(request("/two"))).status).toBe(200);
            expect((await instance.fetch(request("/three/b"))).status).toBe(
                200,
            );
        });
        test("Register the same URL in two groups with different prefixes and route each request to the correct handler", async () => {
            const instance = createRouter();
            instance.group("/first", (first) => {
                first.endpoint({
                    url: "/shared",
                    method: ["GET"],
                    handler: ({ text }) => text("first"),
                });
            });
            instance.group("/second", (second) => {
                second.endpoint({
                    url: "/shared",
                    method: ["GET"],
                    handler: ({ text }) => text("second"),
                });
            });

            expect(
                await (await instance.fetch(request("/first/shared"))).text(),
            ).toBe("first");
            expect(
                await (await instance.fetch(request("/second/shared"))).text(),
            ).toBe("second");
        });
        test("Accept a group defined as an invocable object with an invoke method", async () => {
            const instance = createRouter();
            instance.group({
                invoke: (sub) => {
                    sub.endpoint({
                        url: "/object-group",
                        method: ["GET"],
                        handler: ({ text }) => text("object-group"),
                    });
                },
            });

            const response = await instance.fetch(request("/object-group"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("object-group");
        });
        test("Extract path parameters for endpoints registered inside a group from the request to the full prefixed path", async () => {
            const instance = createRouter();
            instance.group("/api", (api) => {
                api.endpoint({
                    url: "/users/:userId/posts/:postId",
                    method: ["GET"],
                    handler: ({ json, req }) => json({ params: req.params() }),
                });
            });

            const response = await instance.fetch(
                request("/api/users/1/posts/2"),
            );

            expect(await readJson<{ params: unknown }>(response)).toEqual({
                params: { userId: "1", postId: "2" },
            });
        });
        test("Normalize a group prefix that contains leading or trailing slashes", async () => {
            const instance = createRouter();
            instance.group("/api/", (api) => {
                api.endpoint({
                    url: "/resource",
                    method: ["GET"],
                    handler: ({ text }) => text("resource"),
                });
            });

            const response = await instance.fetch(request("/api/resource"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("resource");
        });
        test("Run shared middleware registered with use before the group for endpoints registered inside that group", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.use(async ({ next }) => {
                seen.push("root-middleware");
                return await next();
            });
            instance.group("/api", (api) => {
                api.endpoint({
                    url: "/users",
                    method: ["GET"],
                    handler: ({ text }) => text("users"),
                });
            });

            await (await instance.fetch(request("/api/users"))).text();

            expect(seen).toEqual(["root-middleware"]);
        });
        test("Apply shared middleware registered with use inside a group to endpoints registered afterwards in that group and its nested groups", async () => {
            const seen: string[] = [];
            const instance = createRouter();
            instance.group("/api", (api) => {
                api.use(async ({ next }) => {
                    seen.push("group-middleware");
                    return await next();
                });
                api.endpoint({
                    url: "/first",
                    method: ["GET"],
                    handler: ({ text }) => text("first"),
                });
                api.group("/nested", (nested) => {
                    nested.endpoint({
                        url: "/second",
                        method: ["GET"],
                        handler: ({ text }) => text("second"),
                    });
                });
            });

            await (await instance.fetch(request("/api/first"))).text();
            await (await instance.fetch(request("/api/nested/second"))).text();

            expect(seen).toEqual(["group-middleware", "group-middleware"]);
        });
        test("Throw a TypeError when group is called without any arguments", () => {
            const instance = createRouter();

            const invoke = instance.group as unknown as () => void;

            expect(() => {
                invoke.call(instance);
            }).toThrow(TypeError);
        });
        test("Throw a TypeError when group is called with a prefix string but without a group callback", () => {
            const instance = createRouter();

            const invoke = instance.group as unknown as (
                prefix: string,
            ) => void;

            expect(() => {
                invoke.call(instance, "/api");
            }).toThrow(TypeError);
        });
        test("Throw a TypeError when group is called with a prefix and a value that is not invocable", () => {
            const instance = createRouter();

            const invoke = instance.group as unknown as (
                prefix: string,
                group: object,
            ) => void;

            expect(() => {
                invoke.call(instance, "/api", {});
            }).toThrow(TypeError);
        });
    });
    describe("method: fetch", () => {
        describe("Route matching:", () => {
            test("Dispatch an incoming request to the endpoint whose URL pattern and HTTP method both match and return the response that handler produced", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/dispatch/:name",
                    method: ["GET"],
                    handler: ({ json, req }) =>
                        json({
                            name: req.params()["name"],
                            method: req.method,
                        }),
                });

                const response = await instance.fetch(
                    request("/dispatch/eridu"),
                );

                expect(response.status).toBe(200);
                expect(
                    await readJson<Record<string, unknown>>(response),
                ).toEqual({
                    name: "eridu",
                    method: "GET",
                });
            });
            test("Return a 404 response whose body is 'Not found' and Content-Type is text/html when no endpoint matches the request path", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/known",
                    method: ["GET"],
                    handler: ({ text }) => text("known"),
                });

                const response = await instance.fetch(request("/unknown"));

                expect(response.status).toBe(404);
                expect(response.headers.get("content-type")).toBe("text/html");
                expect(await response.text()).toBe("Not found");
            });
            test("Return a 404 response when the request path matches a registered endpoint but the request method is not registered for that path", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/known-method",
                    method: ["GET"],
                    handler: ({ text }) => text("known-method"),
                });

                const response = await instance.fetch(
                    request("/known-method", { method: "DELETE" }),
                );

                expect(response.status).toBe(404);
            });
            test("Ignore the query string when resolving a route so that only the URL path determines which endpoint handles the request", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/query",
                    method: ["GET"],
                    handler: ({ text }) => text("query"),
                });

                const response = await instance.fetch(
                    request("/query?filter=all&sort=desc"),
                );

                expect(response.status).toBe(200);
                expect(await response.text()).toBe("query");
            });
            test("Ignore the URL fragment, host, and port when resolving a route so that matching depends on the path alone", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/authority",
                    method: ["GET"],
                    handler: ({ text }) => text("authority"),
                });

                const response = await instance.fetch(
                    new Request("https://example.com:8443/authority#section", {
                        method: "GET",
                    }),
                );

                expect(response.status).toBe(200);
                expect(await response.text()).toBe("authority");
            });
            test("Resolve the request method case-insensitively so that a lowercase method reaches the same endpoint as its uppercase form", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/case-insensitive",
                    method: ["get"],
                    handler: ({ text }) => text("case-insensitive"),
                });

                const response = await instance.fetch(
                    request("/case-insensitive"),
                );

                expect(response.status).toBe(200);
                expect(await response.text()).toBe("case-insensitive");
            });
        });
        describe("Response building:", () => {
            test("Return a 200 response when the matched handler returns a response builder without setting an explicit status", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/default-status",
                    method: ["GET"],
                    handler: ({ res }) => res.setBody("body"),
                });

                const response = await instance.fetch(
                    request("/default-status"),
                );

                expect(response.status).toBe(200);
                expect(await response.text()).toBe("body");
            });
            test("Return the status, status text, headers, and body configured on the response builder to the caller", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/full-response",
                    method: ["GET"],
                    handler: ({ res }) =>
                        res
                            .setStatus(203)
                            .setStatusText("Non-Authoritative")
                            .setHeader("X-Header", "value")
                            .setBody("payload"),
                });

                const response = await instance.fetch(
                    request("/full-response"),
                );

                expect(response.status).toBe(203);
                expect(response.statusText).toBe("Non-Authoritative");
                expect(response.headers.get("x-header")).toBe("value");
                expect(await response.text()).toBe("payload");
            });
            test("Await the promise returned by an asynchronous handler before building the final Web API Response", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/async-handler",
                    method: ["GET"],
                    handler: async ({ text }) => {
                        await new Promise((resolve) => setTimeout(resolve, 5));
                        return text("async-handler");
                    },
                });

                const response = await instance.fetch(
                    request("/async-handler"),
                );

                expect(response.status).toBe(200);
                expect(await response.text()).toBe("async-handler");
            });
        });
        describe("Error handling:", () => {
            test("Return a 500 response whose body is 'Unexpected error occurred' when the matched handler throws a value that is not an HttpError", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/throws",
                    method: ["GET"],
                    handler: () => {
                        throw new Error("handler boom");
                    },
                });

                const response = await instance.fetch(request("/throws"));

                expect(response.status).toBe(500);
                expect(await response.text()).toBe("Unexpected error occurred");
            });
            test("Return a 500 response when the matched handler rejects asynchronously with an error that is not an HttpError", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/rejects",
                    method: ["GET"],
                    handler: async () => {
                        await Promise.resolve();
                        throw new Error("handler rejected");
                    },
                });

                const response = await instance.fetch(request("/rejects"));

                expect(response.status).toBe(500);
                expect(await response.text()).toBe("Unexpected error occurred");
            });
            test("Return a JSON response containing the thrown HttpError name, status, message, and payload together with the matching HTTP status code", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/http-error",
                    method: ["GET"],
                    handler: () => {
                        throw HttpError.create({
                            status: "403",
                            message: "Forbidden",
                            payload: { reason: "no-access" },
                        });
                    },
                });

                const response = await instance.fetch(request("/http-error"));

                expect(response.status).toBe(403);
                expect(
                    await readJson<Record<string, unknown>>(response),
                ).toEqual({
                    name: "HttpError",
                    status: "403",
                    message: "Forbidden",
                    payload: { reason: "no-access" },
                });
            });
            test("Omit the payload property from the HttpError response body when the HttpError was created without a payload", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/http-error-no-payload",
                    method: ["GET"],
                    handler: () => {
                        throw HttpError.create({
                            status: "409",
                            message: "Conflict",
                        });
                    },
                });

                const response = await instance.fetch(
                    request("/http-error-no-payload"),
                );

                const body = await readJson<Record<string, unknown>>(response);
                expect(body).toEqual({
                    name: "HttpError",
                    status: "409",
                    message: "Conflict",
                });
                expect("payload" in body).toBe(false);
            });
            test("Return a 500 response when a middleware throws a value that is not an HttpError", async () => {
                const instance = createRouter();
                instance.use(() => {
                    throw new Error("middleware boom");
                });
                instance.endpoint({
                    url: "/middleware-throws",
                    method: ["GET"],
                    handler: ({ text }) => text("never"),
                });

                const response = await instance.fetch(
                    request("/middleware-throws"),
                );

                expect(response.status).toBe(500);
                expect(await response.text()).toBe("Unexpected error occurred");
            });
            test("Return the HttpError status and JSON error body when a middleware throws an HttpError before or after calling next", async () => {
                const instance = createRouter();
                instance.use(() => {
                    throw HttpError.create({
                        status: "401",
                        message: "Unauthorized",
                    });
                });
                instance.endpoint({
                    url: "/middleware-http-error",
                    method: ["GET"],
                    handler: ({ text }) => text("never"),
                });

                const response = await instance.fetch(
                    request("/middleware-http-error"),
                );

                expect(response.status).toBe(401);
                expect(
                    await readJson<Record<string, unknown>>(response),
                ).toEqual({
                    name: "HttpError",
                    status: "401",
                    message: "Unauthorized",
                });
            });
        });
        describe("Request isolation:", () => {
            test("Give every request its own response builder so that headers and status set while handling one request are not observed by another request", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/own-builder",
                    method: ["GET"],
                    handler: ({ json, res }) => {
                        const before = res.getHeader("X-Request-Header");
                        res.setHeader("X-Request-Header", "set");
                        return json({ before });
                    },
                });

                const first = await instance.fetch(request("/own-builder"));
                const second = await instance.fetch(request("/own-builder"));

                expect(await readJson<{ before: unknown }>(first)).toEqual({
                    before: null,
                });
                expect(await readJson<{ before: unknown }>(second)).toEqual({
                    before: null,
                });
            });
            test("Give every request its own execution context so that values stored while handling one request are not visible while handling another request", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/own-context",
                    method: ["GET"],
                    handler: ({ context, json }) => {
                        const before = context.get(USER);
                        context.put(USER, "stored");
                        return json({ before });
                    },
                });

                const first = await instance.fetch(request("/own-context"));
                const second = await instance.fetch(request("/own-context"));

                expect(await readJson<{ before: unknown }>(first)).toEqual({
                    before: null,
                });
                expect(await readJson<{ before: unknown }>(second)).toEqual({
                    before: null,
                });
            });
            test("Handle concurrent requests independently so that the response of one request is unaffected by another request still in flight", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/slow",
                    method: ["GET"],
                    handler: async ({ json, res }) => {
                        res.setHeader("X-Request", "slow");
                        await new Promise((resolve) => setTimeout(resolve, 10));
                        return json({ request: res.getHeader("X-Request") });
                    },
                });
                instance.endpoint({
                    url: "/fast",
                    method: ["GET"],
                    handler: ({ json, res }) => {
                        res.setHeader("X-Request", "fast");
                        return json({ request: res.getHeader("X-Request") });
                    },
                });

                const [slow, fast] = await Promise.all([
                    instance.fetch(request("/slow")),
                    instance.fetch(request("/fast")),
                ]);

                expect(await readJson<{ request: string }>(slow)).toEqual({
                    request: "slow",
                });
                expect(await readJson<{ request: string }>(fast)).toEqual({
                    request: "fast",
                });
            });
        });
        describe("Fetch binding:", () => {
            test("Expose the fetch function as a stable value that resolves routes correctly after it is detached from the router instance", async () => {
                const instance = createRouter();
                instance.endpoint({
                    url: "/detached",
                    method: ["GET"],
                    handler: ({ text }) => text("detached"),
                });
                const { fetch } = instance;

                const response = await fetch(request("/detached"));

                expect(response.status).toBe(200);
                expect(await response.text()).toBe("detached");
            });
        });
    });
    describe("static method: fromWinterTcHandler", () => {
        test("Make the underlying Web API Request available to a WinterTC handler adapted with HttpRouter.fromWinterTcHandler", async () => {
            const instance = createRouter();
            const handler: WinterTcRequestHandler = async (incoming) => {
                const isRequest = incoming instanceof Request;
                await Promise.resolve();
                return new Response(String(isRequest), {
                    headers: { "X-Is-Request": "yes" },
                });
            };
            instance.endpoint({
                url: "/winter-request",
                handler: HttpRouter.fromWinterTcHandler(handler),
            });

            const response = await instance.fetch(
                request("/winter-request", { method: "GET" }),
            );

            expect(response.headers.get("x-is-request")).toBe("yes");
            expect(await response.text()).toBe("true");
        });
        test("Return the Response produced by a WinterTC handler adapted with HttpRouter.fromWinterTcHandler after converting it to the router response", async () => {
            const instance = createRouter();
            const handler: WinterTcRequestHandler = async (incoming) => {
                const path = new URL(incoming.url).pathname;
                await Promise.resolve();
                return new Response(`path:${path}`, {
                    status: 201,
                    headers: { "X-Winter": "yes" },
                });
            };
            instance.endpoint({
                url: "/winter-response",
                handler: HttpRouter.fromWinterTcHandler(handler),
            });

            const response = await instance.fetch(
                request("/winter-response", { method: "GET" }),
            );

            expect(response.status).toBe(201);
            expect(response.headers.get("x-winter")).toBe("yes");
            expect(await response.text()).toBe("path:/winter-response");
        });
        test("Preserve redirect and error status codes returned by a WinterTC handler adapted with HttpRouter.fromWinterTcHandler", async () => {
            const instance = createRouter();
            const handler: WinterTcRequestHandler = async () => {
                await Promise.resolve();
                return new Response(null, {
                    status: 307,
                    headers: { Location: "/target" },
                });
            };
            instance.endpoint({
                url: "/winter-redirect",
                handler: HttpRouter.fromWinterTcHandler(handler),
            });

            const response = await instance.fetch(
                request("/winter-redirect", { method: "GET" }),
            );

            expect(response.status).toBe(307);
            expect(response.headers.get("location")).toBe("/target");
        });
    });
    describe("router setting:", () => {
        test("Construct a router using defaultHttpRouterAdapter() and dispatch requests through the resulting SmartRouter based adapter", async () => {
            const instance = createRouter();
            instance.endpoint({
                url: "/default-adapter",
                method: ["GET"],
                handler: ({ text }) => text("default-adapter"),
            });

            const response = await instance.fetch(request("/default-adapter"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("default-adapter");
        });
        test("Dispatch requests through a router constructed with a custom Hono Router instance supplied through the router setting", async () => {
            const trieRouterModule = await import("hono/router/trie-router");
            const instance = new HttpRouter({
                router: new trieRouterModule.TrieRouter(),
            });
            instance.endpoint({
                url: "/custom-router",
                method: ["GET"],
                handler: ({ text }) => text("custom-router"),
            });

            const response = await instance.fetch(request("/custom-router"));

            expect(response.status).toBe(200);
            expect(await response.text()).toBe("custom-router");
        });
    });
});
