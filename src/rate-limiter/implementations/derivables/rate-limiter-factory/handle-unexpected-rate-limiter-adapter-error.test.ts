import { beforeEach, describe, expect, test, vi } from "vitest";

import { enhanceFactory } from "@/middleware/implementations/enhance-factory/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import {
    UnableToGetStateRateLimiterError,
    UnableToResetRateLimiterError,
    UnableToUpdateStateRateLimiterError,
} from "@/rate-limiter/contracts/_module-exports.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/no-op-rate-limiter-adapter/_module-exports.js";
import { handleUnexpectedRateLimiterAdapterError } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/handle-unexpected-rate-limiter-adapter-error.js";

describe("function: handleUnexpectedRateLimiterAdapterError", () => {
    const adapter = new NoOpRateLimiterAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const unexpectedError = new Error("Unexpected adapter error");
    const key = "myKey";
    const limit = 2;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: getState", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedRateLimiterAdapterError(),
            );

            await expect(enhanced.getState(key)).resolves.toMatchObject({
                success: true,
                attempt: 1,
            });
        });
        test("Should throw UnableToGetStateRateLimiterError when adapter rejects", async () => {
            vi.spyOn(adapter, "getState").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedRateLimiterAdapterError(),
            );

            const promise = enhanced.getState(key);

            await expect(promise).rejects.toThrow(
                UnableToGetStateRateLimiterError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
        test("Should throw UnableToGetStateRateLimiterError when adapter throws synchronously", async () => {
            vi.spyOn(adapter, "getState").mockImplementation(() => {
                throw unexpectedError;
            });
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedRateLimiterAdapterError(),
            );

            const promise = enhanced.getState(key);

            await expect(promise).rejects.toThrow(
                UnableToGetStateRateLimiterError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: updateState", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedRateLimiterAdapterError(),
            );

            await expect(
                enhanced.updateState(key, limit),
            ).resolves.toMatchObject({ success: true });
        });
        test("Should throw UnableToUpdateStateRateLimiterError when adapter rejects", async () => {
            vi.spyOn(adapter, "updateState").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedRateLimiterAdapterError(),
            );

            const promise = enhanced.updateState(key, limit);

            await expect(promise).rejects.toThrow(
                UnableToUpdateStateRateLimiterError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: reset", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedRateLimiterAdapterError(),
            );

            await expect(enhanced.reset(key)).resolves.toBeUndefined();
        });
        test("Should throw UnableToResetRateLimiterError when adapter rejects", async () => {
            vi.spyOn(adapter, "reset").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedRateLimiterAdapterError(),
            );

            const promise = enhanced.reset(key);

            await expect(promise).rejects.toThrow(
                UnableToResetRateLimiterError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });
});
