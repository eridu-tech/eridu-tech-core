import { describe, expect, test } from "vitest";

import {
    UnableToAddListenerEventBusError,
    UnableToDispatchEventBusError,
    UnableToRemoveListenerEventBusError,
} from "@/event-bus/contracts/_module-exports.js";
import { withHttpEventBusError } from "@/event-bus/implementations/middlewares/with-http-event-bus-error/with-http-event-bus-error.js";
import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/_module-exports.js";

import type { AllEventBusErrors } from "@/event-bus/contracts/_module-exports.js";
import type { IHttpRouter } from "@/http-router/contracts/_module-exports.js";

type TestData = {
    name: string;
    status: number;
    message: string;
    error: AllEventBusErrors;
};

function createRouter(): IHttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(withHttpEventBusError());
    return router;
}

async function fetchWithError(error: unknown): Promise<Response> {
    const router = createRouter();
    router.endpoint({
        url: "/error",
        method: ["GET"],
        handler: () => {
            throw error;
        },
    });

    return router.fetch(new Request("https://example.com/error"));
}

describe("file: with-http-event-bus-error.ts", () => {
    describe("function: withHttpEventBusError", () => {
        const testCases: Array<TestData> = [
            {
                name: "UnableToDispatchEventBusError",
                status: 503,
                message: "Event bus adapter failed",
                error: UnableToDispatchEventBusError.create("event-1"),
            },
            {
                name: "UnableToAddListenerEventBusError",
                status: 503,
                message: "Event bus adapter failed",
                error: UnableToAddListenerEventBusError.create("event-1"),
            },
            {
                name: "UnableToRemoveListenerEventBusError",
                status: 503,
                message: "Event bus adapter failed",
                error: UnableToRemoveListenerEventBusError.create("event-1"),
            },
        ];

        test.each(testCases)(
            "Should convert $name to an HttpError response with status $status",
            async (testCase) => {
                const response = await fetchWithError(testCase.error);

                expect(response.status).toBe(testCase.status);
                await expect(response.json()).resolves.toEqual({
                    name: "HttpError",
                    status: String(testCase.status),
                    message: testCase.message,
                });
            },
        );
        test("Should return a generic 500 response when the error is not an event bus error", async () => {
            const response = await fetchWithError(new Error("generic"));

            expect(response.status).toBe(500);
            await expect(response.text()).resolves.toBe(
                "Unexpected error occurred",
            );
        });
        test("Should return the endpoint response when nothing is thrown", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/ok",
                method: ["GET"],
                handler: (args) => args.json({ ok: true }),
            });

            const response = await router.fetch(
                new Request("https://example.com/ok"),
            );

            expect(response.status).toBe(200);
            await expect(response.json()).resolves.toEqual({ ok: true });
        });
    });
});
