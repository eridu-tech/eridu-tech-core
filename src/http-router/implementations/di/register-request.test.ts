/*
 * The handler args expose stateless response helpers (`text`, ...) that are
 * documented to be destructured, which reads as an unbound method reference.
 */
/* eslint-disable @typescript-eslint/unbound-method */

import { describe, expect, test } from "vitest";

import {
    CanNotRegisterServiceDiError,
    InvalidMethodCallDiError,
} from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    REQUEST,
    registerRequest,
} from "@/http-router/implementations/di/register-request.js";
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@/http-router/implementations/http-router.js";

describe("function: registerRequest", () => {
    test("Should register the incoming request under the REQUEST token", async () => {
        const container = new Container({
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
        router.use(registerRequest(container));
        await container.init();
        router.endpoint({
            url: "/users/:id",
            method: ["GET"],
            handler: async ({ text }) => {
                const req = await container.resolveOrFail(REQUEST);
                return text(req.url);
            },
        });

        const response = await router.fetch(
            new Request("https://example.com/users/42"),
        );

        expect(response.status).toBe(200);
        expect(await response.text()).toBe("https://example.com/users/42");
    });
    test("Should run the next handler inside the request scope", async () => {
        const container = new Container({
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
        router.use(registerRequest(container));
        await container.init();
        router.endpoint({
            url: "/users",
            method: ["GET"],
            handler: ({ text }) => text("ok"),
        });

        const response = await router.fetch(
            new Request("https://example.com/users"),
        );

        expect(response.status).toBe(200);
        expect(await response.text()).toBe("ok");
    });
    test("Should keep each request in its own scope", async () => {
        const container = new Container({
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
        router.use(registerRequest(container));
        await container.init();
        router.endpoint({
            url: "/users/:id",
            method: ["GET"],
            handler: async ({ text }) => {
                await new Promise((resolve) => {
                    setTimeout(resolve, 0);
                });
                const req = await container.resolveOrFail(REQUEST);
                return text(req.url);
            },
        });

        const [first, second] = await Promise.all([
            router.fetch(new Request("https://example.com/users/1")),
            router.fetch(new Request("https://example.com/users/2")),
        ]);

        expect(await first.text()).toBe("https://example.com/users/1");
        expect(await second.text()).toBe("https://example.com/users/2");
    });
    test("Should return a 500 response and skip the handler when the container is not initialized", async () => {
        const container = new Container({
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
        router.use(registerRequest(container));
        let wasHandlerInvoked = false;
        router.endpoint({
            url: "/users",
            method: ["GET"],
            handler: ({ text }) => {
                wasHandlerInvoked = true;
                return text("ok");
            },
        });

        const response = await router.fetch(
            new Request("https://example.com/users"),
        );

        expect(response.status).toBe(500);
        expect(wasHandlerInvoked).toBe(false);
    });
    test("Should throw when the container is already initialized", async () => {
        const container = new Container({
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        await container.init();

        expect(() => registerRequest(container)).toThrow(
            InvalidMethodCallDiError,
        );
    });
    test("Should throw when REQUEST is already registered", () => {
        const container = new Container({
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

        registerRequest(container);

        expect(() => registerRequest(container)).toThrow(
            CanNotRegisterServiceDiError,
        );
    });
});
