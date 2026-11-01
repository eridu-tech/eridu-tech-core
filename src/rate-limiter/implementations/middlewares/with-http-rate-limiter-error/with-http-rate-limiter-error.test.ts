import { describe, expect, test } from "vitest";

import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/http-router/_module-exports.js";
import {
    BlockedRateLimiterError,
    UnableToGetStateRateLimiterError,
    UnableToResetRateLimiterError,
    UnableToUpdateStateRateLimiterError,
} from "@/rate-limiter/contracts/_module-exports.js";
import { withHttpRateLimiterError } from "@/rate-limiter/implementations/middlewares/with-http-rate-limiter-error/with-http-rate-limiter-error.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { IHttpRouter } from "@/http-router/contracts/_module-exports.js";
import type { AllRateLimiterErrors } from "@/rate-limiter/contracts/_module-exports.js";

type TestData = {
    name: string;
    status: number;
    message: string;
    error: AllRateLimiterErrors;
};

function createRouter(): IHttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(withHttpRateLimiterError());
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

describe("file: with-http-rate-limiter-error.ts", () => {
    describe("function: withHttpRateLimiterError", () => {
        const testCases: Array<TestData> = [
            {
                name: "BlockedRateLimiterError",
                status: 429,
                message: "Too many requests",
                error: BlockedRateLimiterError.create(
                    {
                        limit: 5,
                        totalAttempts: 7,
                        exceedAttempts: 2,
                        retryAfter: TimeSpan.fromSeconds(1),
                    },
                    "a",
                ),
            },
            {
                name: "UnableToGetStateRateLimiterError",
                status: 503,
                message: "Rate limiter adapter failed",
                error: UnableToGetStateRateLimiterError.create("a"),
            },
            {
                name: "UnableToUpdateStateRateLimiterError",
                status: 503,
                message: "Rate limiter adapter failed",
                error: UnableToUpdateStateRateLimiterError.create("a"),
            },
            {
                name: "UnableToResetRateLimiterError",
                status: 503,
                message: "Rate limiter adapter failed",
                error: UnableToResetRateLimiterError.create("a"),
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
        test("Should set rate limiter headers when the error is blocked", async () => {
            const error = BlockedRateLimiterError.create(
                {
                    limit: 5,
                    totalAttempts: 12,
                    exceedAttempts: 7,
                    retryAfter: TimeSpan.fromSeconds(2),
                },
                "a",
            );

            const response = await fetchWithError(error);

            expect(response.headers.get("RateLimit")).toBe("5");
            expect(response.headers.get("Retry-After")).toBe("2");
        });
        test("Should round the rate limiter durations up to the next second", async () => {
            const error = BlockedRateLimiterError.create(
                {
                    limit: 5,
                    totalAttempts: 6,
                    exceedAttempts: 1,
                    retryAfter: TimeSpan.fromMilliseconds(1500),
                },
                "a",
            );

            const response = await fetchWithError(error);

            expect(response.headers.get("Retry-After")).toBe("2");
        });
        test("Should not set rate limiter headers when the adapter fails", async () => {
            const response = await fetchWithError(
                UnableToGetStateRateLimiterError.create("a"),
            );

            expect(response.headers.get("RateLimit")).toBeNull();
            expect(response.headers.get("Retry-After")).toBeNull();
        });
        test("Should return a generic 500 response when the error is not a rate limiter error", async () => {
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
