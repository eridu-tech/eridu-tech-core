import { describe, expect, test } from "vitest";

import {
    IsolatedCircuitBreakerError,
    OpenCircuitBreakerError,
    UnableToGetStateCircuitBreakerError,
    UnableToIsolateCircuitBreakerError,
    UnableToResetCircuitBreakerError,
    UnableToTrackFailureCircuitBreakerError,
    UnableToTrackSuccessCircuitBreakerError,
    UnableToUpdateStateCircuitBreakerError,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { withHttpCircuitBreakerError } from "@/circuit-breaker/implementations/middlewares/with-http-circuit-breaker-error/with-http-circuit-breaker-error.js";
import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/http-router/_module-exports.js";

import type { AllCircuitBreakerErrors } from "@/circuit-breaker/contracts/_module-exports.js";
import type { IHttpRouter } from "@/http-router/contracts/_module-exports.js";

type TestData = {
    name: string;
    status: number;
    message: string;
    error: AllCircuitBreakerErrors;
};

function createRouter(): IHttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(withHttpCircuitBreakerError());
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

describe("file: with-http-circuit-breaker-error.ts", () => {
    describe("function: withHttpCircuitBreakerError", () => {
        const testCases: Array<TestData> = [
            {
                name: "OpenCircuitBreakerError",
                status: 503,
                message: "Circuit breaker is open",
                error: OpenCircuitBreakerError.create("a"),
            },
            {
                name: "IsolatedCircuitBreakerError",
                status: 503,
                message: "Circuit breaker is isolated",
                error: IsolatedCircuitBreakerError.create("a"),
            },
            {
                name: "UnableToGetStateCircuitBreakerError",
                status: 503,
                message: "Circuit breaker adapter failed",
                error: UnableToGetStateCircuitBreakerError.create("a"),
            },
            {
                name: "UnableToUpdateStateCircuitBreakerError",
                status: 503,
                message: "Circuit breaker adapter failed",
                error: UnableToUpdateStateCircuitBreakerError.create("a"),
            },
            {
                name: "UnableToIsolateCircuitBreakerError",
                status: 503,
                message: "Circuit breaker adapter failed",
                error: UnableToIsolateCircuitBreakerError.create("a"),
            },
            {
                name: "UnableToTrackFailureCircuitBreakerError",
                status: 503,
                message: "Circuit breaker adapter failed",
                error: UnableToTrackFailureCircuitBreakerError.create("a"),
            },
            {
                name: "UnableToTrackSuccessCircuitBreakerError",
                status: 503,
                message: "Circuit breaker adapter failed",
                error: UnableToTrackSuccessCircuitBreakerError.create("a"),
            },
            {
                name: "UnableToResetCircuitBreakerError",
                status: 503,
                message: "Circuit breaker adapter failed",
                error: UnableToResetCircuitBreakerError.create("a"),
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
        test("Should return a generic 500 response when the error is not a circuit breaker error", async () => {
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
