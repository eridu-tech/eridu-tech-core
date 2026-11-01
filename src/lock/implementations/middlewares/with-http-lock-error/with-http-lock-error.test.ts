import { describe, expect, test } from "vitest";

import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/_module-exports.js";
import {
    FailedAcquireLockError,
    FailedRefreshLockError,
    FailedReleaseLockError,
    UnableToAcquireLockError,
    UnableToForceReleaseLockError,
    UnableToGetStateLockError,
    UnableToRefreshLockError,
    UnableToReleaseLockError,
} from "@/lock/contracts/_module-exports.js";
import { withHttpLockError } from "@/lock/implementations/middlewares/with-http-lock-error/with-http-lock-error.js";

import type { IHttpRouter } from "@/http-router/contracts/_module-exports.js";
import type { AllLockErrors } from "@/lock/contracts/_module-exports.js";

type TestData = {
    name: string;
    status: number;
    message: string;
    error: AllLockErrors;
};

function createRouter(): IHttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(withHttpLockError());
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

describe("file: with-http-lock-error.ts", () => {
    describe("function: withHttpLockError", () => {
        const testCases: Array<TestData> = [
            {
                name: "FailedAcquireLockError",
                status: 409,
                message: "Lock is not available",
                error: FailedAcquireLockError.create("a"),
            },
            {
                name: "FailedReleaseLockError",
                status: 409,
                message: "Lock is not available",
                error: FailedReleaseLockError.create("a", "lock-1"),
            },
            {
                name: "FailedRefreshLockError",
                status: 409,
                message: "Lock is not available",
                error: FailedRefreshLockError.create("a", "lock-1"),
            },
            {
                name: "UnableToAcquireLockError",
                status: 503,
                message: "Lock adapter failed",
                error: UnableToAcquireLockError.create("a"),
            },
            {
                name: "UnableToReleaseLockError",
                status: 503,
                message: "Lock adapter failed",
                error: UnableToReleaseLockError.create("a", "lock-1"),
            },
            {
                name: "UnableToForceReleaseLockError",
                status: 503,
                message: "Lock adapter failed",
                error: UnableToForceReleaseLockError.create("a"),
            },
            {
                name: "UnableToRefreshLockError",
                status: 503,
                message: "Lock adapter failed",
                error: UnableToRefreshLockError.create("a", "lock-1"),
            },
            {
                name: "UnableToGetStateLockError",
                status: 503,
                message: "Lock adapter failed",
                error: UnableToGetStateLockError.create("a"),
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
        test("Should return a generic 500 response when the error is not a lock error", async () => {
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
