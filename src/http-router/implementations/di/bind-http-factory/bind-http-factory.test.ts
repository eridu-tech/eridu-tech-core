/*
 * The handler args expose stateless response helpers (`text`, ...) that are
 * documented to be destructured, which reads as an unbound method reference.
 */
/* eslint-disable @typescript-eslint/unbound-method */

import { describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { bindHttpFactory } from "@/http-router/implementations/di/bind-http-factory/bind-http-factory.js";
import {
    HttpRouter,
    defaultHttpRouterAdapter,
} from "@/http-router/implementations/http-router.js";

import type { HttpHandlerFn } from "@/http-router/contracts/_module-exports.js";

describe("function: bindHttpFactory", () => {
    test("Should resolve the controller from the container and invoke the bound method", async () => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        class UsersController {
            getUser: HttpHandlerFn = (args) => {
                return args.text("Hi from UsersController");
            };
        }
        container.registerValue({
            token: UsersController,
            value: new UsersController(),
        });

        await container.init();

        const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
        router.endpoint({
            method: ["GET"],
            url: "/users/:id",
            handler: bindHttpFactory(container)(UsersController, "getUser"),
        });

        const response = await router.fetch(
            new Request("https://example.com/users/42"),
        );

        expect(response.status).toBe(200);
        expect(await response.text()).toBe("Hi from UsersController");
    });
});
