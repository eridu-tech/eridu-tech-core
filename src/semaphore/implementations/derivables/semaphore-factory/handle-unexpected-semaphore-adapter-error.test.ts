import { beforeEach, describe, expect, test, vi } from "vitest";

import { enhanceFactory } from "@/middleware/implementations/enhance-factory/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import {
    UnableToAcquireSemaphoreError,
    UnableToForceReleaseAllSemaphoreError,
    UnableToGetStateSemaphoreError,
    UnableToRefreshSemaphoreError,
    UnableToReleaseSemaphoreError,
} from "@/semaphore/contracts/_module-exports.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/no-op-semaphore-adapter/_module-exports.js";
import { handleUnexpectedSemaphoreAdapterError } from "@/semaphore/implementations/derivables/semaphore-factory/handle-unexpected-semaphore-adapter-error.js";

describe("function: handleUnexpectedSemaphoreAdapterError", () => {
    const adapter = new NoOpSemaphoreAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const unexpectedError = new Error("Unexpected adapter error");
    const key = "myKey";
    const slotId = "mySlotId";
    const limit = 2;
    const currentDate = new Date();

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: acquire", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            await expect(
                enhanced.acquire({ key, slotId, limit, ttl: null }),
            ).resolves.toBe(true);
        });
        test("Should throw UnableToAcquireSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "acquire").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            const promise = enhanced.acquire({
                key,
                slotId,
                limit,
                ttl: null,
            });

            await expect(promise).rejects.toThrow(
                UnableToAcquireSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
        test("Should throw UnableToAcquireSemaphoreError when adapter throws synchronously", async () => {
            vi.spyOn(adapter, "acquire").mockImplementation(() => {
                throw unexpectedError;
            });
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            const promise = enhanced.acquire({
                key,
                slotId,
                limit,
                ttl: null,
            });

            await expect(promise).rejects.toThrow(
                UnableToAcquireSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: release", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            await expect(enhanced.release(key, slotId)).resolves.toBe(true);
        });
        test("Should throw UnableToReleaseSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "release").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            const promise = enhanced.release(key, slotId);

            await expect(promise).rejects.toThrow(
                UnableToReleaseSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: forceReleaseAll", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            await expect(enhanced.forceReleaseAll(key)).resolves.toBe(true);
        });
        test("Should throw UnableToForceReleaseAllSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "forceReleaseAll").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            const promise = enhanced.forceReleaseAll(key);

            await expect(promise).rejects.toThrow(
                UnableToForceReleaseAllSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: refresh", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            await expect(
                enhanced.refresh(key, slotId, currentDate),
            ).resolves.toBe(true);
        });
        test("Should throw UnableToRefreshSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "refresh").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            const promise = enhanced.refresh(key, slotId, currentDate);

            await expect(promise).rejects.toThrow(
                UnableToRefreshSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: getState", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            await expect(enhanced.getState(key)).resolves.toEqual({
                limit: Infinity,
                acquiredSlots: new Map(),
            });
        });
        test("Should throw UnableToGetStateSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "getState").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSemaphoreAdapterError(),
            );

            const promise = enhanced.getState(key);

            await expect(promise).rejects.toThrow(
                UnableToGetStateSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });
});
