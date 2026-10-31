import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    UnableToAcquireLockError,
    UnableToForceReleaseLockError,
    UnableToGetStateLockError,
    UnableToRefreshLockError,
    UnableToReleaseLockError,
} from "@/lock/contracts/_module-exports.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/_module-exports.js";
import { handleUnexpectedLockAdapterError } from "@/lock/implementations/derivables/lock-factory/handle-unexpected-lock-adapter-error.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: handleUnexpectedLockAdapterError", () => {
    const adapter = new NoOpLockAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const unexpectedError = new Error("Unexpected adapter error");
    const key = "myKey";
    const lockId = "myLockId";
    const currentDate = new Date();

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: acquire", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedLockAdapterError(),
            );

            await expect(enhanced.acquire(key, lockId, null)).resolves.toBe(
                true,
            );
        });
        test("Should throw UnableToAcquireLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "acquire").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedLockAdapterError(),
            );

            const promise = enhanced.acquire(key, lockId, null);

            await expect(promise).rejects.toThrow(UnableToAcquireLockError);
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
        test("Should throw UnableToAcquireLockError when adapter throws synchronously", async () => {
            vi.spyOn(adapter, "acquire").mockImplementation(() => {
                throw unexpectedError;
            });
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedLockAdapterError(),
            );

            const promise = enhanced.acquire(key, lockId, null);

            await expect(promise).rejects.toThrow(UnableToAcquireLockError);
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
                handleUnexpectedLockAdapterError(),
            );

            await expect(enhanced.release(key, lockId)).resolves.toBe(true);
        });
        test("Should throw UnableToReleaseLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "release").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedLockAdapterError(),
            );

            const promise = enhanced.release(key, lockId);

            await expect(promise).rejects.toThrow(UnableToReleaseLockError);
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
                handleUnexpectedLockAdapterError(),
            );

            await expect(enhanced.forceRelease(key)).resolves.toBe(true);
        });
        test("Should throw UnableToForceReleaseLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "forceRelease").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedLockAdapterError(),
            );

            const promise = enhanced.forceRelease(key);

            await expect(promise).rejects.toThrow(
                UnableToForceReleaseLockError,
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
                handleUnexpectedLockAdapterError(),
            );

            await expect(
                enhanced.refresh(key, lockId, currentDate),
            ).resolves.toBe(true);
        });
        test("Should throw UnableToRefreshLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "refresh").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedLockAdapterError(),
            );

            const promise = enhanced.refresh(key, lockId, currentDate);

            await expect(promise).rejects.toThrow(UnableToRefreshLockError);
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
                handleUnexpectedLockAdapterError(),
            );

            await expect(enhanced.getState(key)).resolves.toBeNull();
        });
        test("Should throw UnableToGetStateLockError when adapter rejects", async () => {
            vi.spyOn(adapter, "getState").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedLockAdapterError(),
            );

            const promise = enhanced.getState(key);

            await expect(promise).rejects.toThrow(UnableToGetStateLockError);
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });
});
