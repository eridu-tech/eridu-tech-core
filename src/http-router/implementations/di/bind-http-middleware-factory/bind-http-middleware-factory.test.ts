import { describe, expect, test, vi } from "vitest";

import { LIFETIME, genericToken } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { bindHttpMiddlewareFactory } from "@/http-router/implementations/di/bind-http-middleware-factory/bind-http-middleware-factory.js";
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@/http-router/implementations/http-router/http-router.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type {
    HttpMiddleware,
    HttpMiddlewareArgs,
    HttpMiddlewareFn,
} from "@/http-router/contracts/_module-exports.js";

function createContainer(): Container {
    return new Container({
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
}

function createRouter(middleware: HttpMiddleware): HttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(middleware);
    router.endpoint({
        url: "/users",
        method: ["GET"],
        handler: ({ text }) => text("ok"),
    });
    return router;
}

function fetchPath(router: HttpRouter, path: string): Promise<Response> {
    return router.fetch(new Request(`https://example.com${path}`));
}

describe("function: bindHttpMiddlewareFactory", () => {
    test("Should resolve the middleware from the container and run it around the handler", async () => {
        const token = genericToken<HttpMiddleware>("loggingMiddleware");
        const container = createContainer();
        const middleware: HttpMiddlewareFn = async (args) => {
            const response = await args.next();
            return response.setHeader("X-Logged", "yes");
        };
        container.registerValue({ token, value: middleware });
        await container.init();

        const router = createRouter(
            bindHttpMiddlewareFactory(container)(token),
        );

        const response = await fetchPath(router, "/users");

        expect(response.headers.get("x-logged")).toBe("yes");
        expect(await response.text()).toBe("ok");
    });
    test("Should invoke an invocable object middleware", async () => {
        const token = genericToken<HttpMiddleware>("objectMiddleware");
        const container = createContainer();
        const invoke = vi.fn((args: HttpMiddlewareArgs) => args.next());
        container.registerValue({ token, value: { invoke } });
        await container.init();

        const router = createRouter(
            bindHttpMiddlewareFactory(container)(token),
        );

        const response = await fetchPath(router, "/users");

        expect(invoke).toHaveBeenCalledTimes(1);
        expect(await response.text()).toBe("ok");
    });
    test("Should resolve the middleware from the container for every request", async () => {
        const token = genericToken<HttpMiddleware>("transientMiddleware");
        const container = createContainer();
        const resolveMiddleware = vi.fn<() => HttpMiddlewareFn>(() => {
            return (args) => args.next();
        });
        container.registerFactory({
            token,
            lifetime: LIFETIME.TRANSIENT,
            deps: {},
            factory: resolveMiddleware,
        });
        await container.init();

        const router = createRouter(
            bindHttpMiddlewareFactory(container)(token),
        );

        await fetchPath(router, "/users");
        await fetchPath(router, "/users");

        expect(resolveMiddleware).toHaveBeenCalledTimes(2);
    });
    test("Should throw an UnexpectedError when the resolved middleware is not invocable", async () => {
        const token = genericToken<HttpMiddleware>("invalidMiddleware");
        const container = createContainer();
        container.registerValue({
            token,
            value: { notInvocable: true } as unknown as HttpMiddleware,
        });
        await container.init();

        const bound = bindHttpMiddlewareFactory(container)(token);

        await expect(
            bound({ next: vi.fn() } as unknown as HttpMiddlewareArgs),
        ).rejects.toThrow(UnexpectedError);
    });
});
