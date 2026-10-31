import { beforeEach, describe, expect, test, vi } from "vitest";

import { enhanceFactory } from "@/middleware/implementations/enhance-factory/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";
import {
    UnableToAcquireReaderSemaphoreError,
    UnableToAcquireWriterLockError,
    UnableToForceReleaseSharedLockError,
    UnableToGetStateSharedLockError,
    UnableToRefreshReaderSemaphoreError,
    UnableToRefreshWriterLockError,
    UnableToReleaseReaderSemaphoreError,
    UnableToReleaseWriterLockError,
} from "@/shared-lock/contracts/_module-exports.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/no-op-shared-lock-adapter/_module-exports.js";
import { handleUnexpectedSharedLockAdapterError } from "@/shared-lock/implementations/derivables/shared-lock-factory/handle-unexpected-shared-lock-adapter-error.js";

describe("function: handleUnexpectedSharedLockAdapterError", () => {
    const adapter = new NoOpSharedLockAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const unexpectedError = new Error("Unexpected adapter error");
    const key = "myKey";
    const lockId = "myLockId";
    const slotId = "mySlotId";
    const limit = 2;
    const currentDate = new Date();

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: acquireWriter", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(
                enhanced.acquireWriter(key, lockId, null),
            ).resolves.toBe(true);
        });
        test("Should throw UnableToAcquireWriterLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "acquireWriter").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.acquireWriter(key, lockId, null);

            await expect(promise).rejects.toThrow(
                UnableToAcquireWriterLockError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: releaseWriter", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(enhanced.releaseWriter(key, lockId)).resolves.toBe(
                true,
            );
        });
        test("Should throw UnableToReleaseWriterLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "releaseWriter").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.releaseWriter(key, lockId);

            await expect(promise).rejects.toThrow(
                UnableToReleaseWriterLockError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: refreshWriter", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(
                enhanced.refreshWriter(key, lockId, currentDate),
            ).resolves.toBe(true);
        });
        test("Should throw UnableToRefreshWriterLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "refreshWriter").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.refreshWriter(key, lockId, currentDate);

            await expect(promise).rejects.toThrow(
                UnableToRefreshWriterLockError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: acquireReader", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(
                enhanced.acquireReader({ key, lockId, limit, ttl: null }),
            ).resolves.toBe(true);
        });
        test("Should throw UnableToAcquireReaderSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "acquireReader").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.acquireReader({
                key,
                lockId,
                limit,
                ttl: null,
            });

            await expect(promise).rejects.toThrow(
                UnableToAcquireReaderSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
        test("Should throw UnableToAcquireReaderSemaphoreError when adapter throws synchronously", async () => {
            vi.spyOn(adapter, "acquireReader").mockImplementation(() => {
                throw unexpectedError;
            });
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.acquireReader({
                key,
                lockId,
                limit,
                ttl: null,
            });

            await expect(promise).rejects.toThrow(
                UnableToAcquireReaderSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: releaseReader", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(enhanced.releaseReader(key, slotId)).resolves.toBe(
                true,
            );
        });
        test("Should throw UnableToReleaseReaderSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "releaseReader").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.releaseReader(key, slotId);

            await expect(promise).rejects.toThrow(
                UnableToReleaseReaderSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: refreshReader", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(
                enhanced.refreshReader(key, slotId, currentDate),
            ).resolves.toBe(true);
        });
        test("Should throw UnableToRefreshReaderSemaphoreError when adapter rejects", async () => {
            vi.spyOn(adapter, "refreshReader").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.refreshReader(key, slotId, currentDate);

            await expect(promise).rejects.toThrow(
                UnableToRefreshReaderSemaphoreError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: forceRelease", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(enhanced.forceRelease(key)).resolves.toBe(true);
        });
        test("Should throw UnableToForceReleaseSharedLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "forceRelease").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.forceRelease(key);

            await expect(promise).rejects.toThrow(
                UnableToForceReleaseSharedLockError,
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
                handleUnexpectedSharedLockAdapterError(),
            );

            await expect(enhanced.getState(key)).resolves.toBeNull();
        });
        test("Should throw UnableToGetStateSharedLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "getState").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedSharedLockAdapterError(),
            );

            const promise = enhanced.getState(key);

            await expect(promise).rejects.toThrow(
                UnableToGetStateSharedLockError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });
});
