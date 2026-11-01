import { describe, expect, test } from "vitest";

import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/_module-exports.js";
import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    LimitReachedReaderSemaphoreError,
    UnableToAcquireReaderSemaphoreError,
    UnableToAcquireWriterLockError,
    UnableToForceReleaseSharedLockError,
    UnableToGetStateSharedLockError,
    UnableToRefreshReaderSemaphoreError,
    UnableToRefreshWriterLockError,
    UnableToReleaseReaderSemaphoreError,
    UnableToReleaseWriterLockError,
} from "@/shared-lock/contracts/_module-exports.js";
import { withHttpSharedLockError } from "@/shared-lock/implementations/middlewares/with-http-shared-lock-error/with-http-shared-lock-error.js";

import type { IHttpRouter } from "@/http-router/contracts/_module-exports.js";
import type { AllSharedLockErrors } from "@/shared-lock/contracts/_module-exports.js";

type TestData = {
    name: string;
    status: number;
    message: string;
    error: AllSharedLockErrors;
};

function createRouter(): IHttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(withHttpSharedLockError());
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

describe("file: with-http-shared-lock-error.ts", () => {
    describe("function: withHttpSharedLockError", () => {
        const testCases: Array<TestData> = [
            {
                name: "LimitReachedReaderSemaphoreError",
                status: 429,
                message: "Reader semaphore limit reached",
                error: LimitReachedReaderSemaphoreError.create("a"),
            },
            {
                name: "FailedRefreshReaderSemaphoreError",
                status: 409,
                message: "Shared lock is not available",
                error: FailedRefreshReaderSemaphoreError.create("a", "slot-1"),
            },
            {
                name: "FailedReleaseReaderSemaphoreError",
                status: 409,
                message: "Shared lock is not available",
                error: FailedReleaseReaderSemaphoreError.create("a", "slot-1"),
            },
            {
                name: "UnableToAcquireReaderSemaphoreError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToAcquireReaderSemaphoreError.create("a"),
            },
            {
                name: "UnableToReleaseReaderSemaphoreError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToReleaseReaderSemaphoreError.create(
                    "a",
                    "slot-1",
                ),
            },
            {
                name: "UnableToRefreshReaderSemaphoreError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToRefreshReaderSemaphoreError.create(
                    "a",
                    "slot-1",
                ),
            },
            {
                name: "FailedAcquireWriterLockError",
                status: 409,
                message: "Shared lock is not available",
                error: FailedAcquireWriterLockError.create("a"),
            },
            {
                name: "FailedReleaseWriterLockError",
                status: 409,
                message: "Shared lock is not available",
                error: FailedReleaseWriterLockError.create("a", "lock-1"),
            },
            {
                name: "FailedRefreshWriterLockError",
                status: 409,
                message: "Shared lock is not available",
                error: FailedRefreshWriterLockError.create("a", "lock-1"),
            },
            {
                name: "UnableToAcquireWriterLockError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToAcquireWriterLockError.create("a", "lock-1"),
            },
            {
                name: "UnableToReleaseWriterLockError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToReleaseWriterLockError.create("a", "lock-1"),
            },
            {
                name: "UnableToRefreshWriterLockError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToRefreshWriterLockError.create("a", "lock-1"),
            },
            {
                name: "UnableToForceReleaseSharedLockError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToForceReleaseSharedLockError.create("a"),
            },
            {
                name: "UnableToGetStateSharedLockError",
                status: 503,
                message: "Shared lock adapter failed",
                error: UnableToGetStateSharedLockError.create("a"),
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
        test("Should return a generic 500 response when the error is not a shared-lock error", async () => {
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
