import { describe, expect, test } from "vitest";

import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/http-router.js";
import {
    FailedRefreshSemaphoreError,
    FailedReleaseSemaphoreError,
    LimitReachedSemaphoreError,
    UnableToAcquireSemaphoreError,
    UnableToForceReleaseAllSemaphoreError,
    UnableToGetStateSemaphoreError,
    UnableToRefreshSemaphoreError,
    UnableToReleaseSemaphoreError,
} from "@/semaphore/contracts/_module-exports.js";
import { withHttpSemaphoreError } from "@/semaphore/implementations/middlewares/with-http-semaphore-error/with-http-semaphore-error.js";

import type { IHttpRouter } from "@/http-router/contracts/_module-exports.js";
import type { AllSemaphoreErrors } from "@/semaphore/contracts/_module-exports.js";

type TestData = {
    name: string;
    status: number;
    message: string;
    error: AllSemaphoreErrors;
};

function createRouter(): IHttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(withHttpSemaphoreError());
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

describe("file: with-http-semaphore-error.ts", () => {
    describe("function: withHttpSemaphoreError", () => {
        const testCases: Array<TestData> = [
            {
                name: "LimitReachedSemaphoreError",
                status: 429,
                message: "Semaphore limit reached",
                error: LimitReachedSemaphoreError.create("a"),
            },
            {
                name: "FailedRefreshSemaphoreError",
                status: 409,
                message: "Semaphore slot is no longer valid",
                error: FailedRefreshSemaphoreError.create("a", "slot-1"),
            },
            {
                name: "FailedReleaseSemaphoreError",
                status: 409,
                message: "Semaphore slot is no longer valid",
                error: FailedReleaseSemaphoreError.create("a", "slot-1"),
            },
            {
                name: "UnableToAcquireSemaphoreError",
                status: 503,
                message: "Semaphore adapter failed",
                error: UnableToAcquireSemaphoreError.create("a"),
            },
            {
                name: "UnableToReleaseSemaphoreError",
                status: 503,
                message: "Semaphore adapter failed",
                error: UnableToReleaseSemaphoreError.create("a", "slot-1"),
            },
            {
                name: "UnableToForceReleaseAllSemaphoreError",
                status: 503,
                message: "Semaphore adapter failed",
                error: UnableToForceReleaseAllSemaphoreError.create("a"),
            },
            {
                name: "UnableToRefreshSemaphoreError",
                status: 503,
                message: "Semaphore adapter failed",
                error: UnableToRefreshSemaphoreError.create("a", "slot-1"),
            },
            {
                name: "UnableToGetStateSemaphoreError",
                status: 503,
                message: "Semaphore adapter failed",
                error: UnableToGetStateSemaphoreError.create("a"),
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
        test("Should return a generic 500 response when the error is not a semaphore error", async () => {
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
