import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    CIRCUIT_BREAKER_STATE,
    UnableToGetStateCircuitBreakerError,
    UnableToIsolateCircuitBreakerError,
    UnableToResetCircuitBreakerError,
    UnableToTrackFailureCircuitBreakerError,
    UnableToTrackSuccessCircuitBreakerError,
    UnableToUpdateStateCircuitBreakerError,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/no-op-circuit-breaker-adapter/_module-exports.js";
import { handleUnexpectedCircuitBreakerAdapterError } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/handle-unexpected-circuit-breaker-adapter-error.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: handleUnexpectedCircuitBreakerAdapterError", () => {
    const adapter = new NoOpCircuitBreakerAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const unexpectedError = new Error("Unexpected adapter error");
    const key = "myKey";

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: getState", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            await expect(enhanced.getState(key)).resolves.toBe(
                CIRCUIT_BREAKER_STATE.CLOSED,
            );
        });
        test("Should throw UnableToGetStateCircuitBreakerError when adapter rejects", async () => {
            vi.spyOn(adapter, "getState").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            const promise = enhanced.getState(key);

            await expect(promise).rejects.toThrow(
                UnableToGetStateCircuitBreakerError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
        test("Should throw UnableToGetStateCircuitBreakerError when adapter throws synchronously", async () => {
            vi.spyOn(adapter, "getState").mockImplementation(() => {
                throw unexpectedError;
            });
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            const promise = enhanced.getState(key);

            await expect(promise).rejects.toThrow(
                UnableToGetStateCircuitBreakerError,
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
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            await expect(enhanced.updateState(key)).resolves.toEqual({
                from: CIRCUIT_BREAKER_STATE.CLOSED,
                to: CIRCUIT_BREAKER_STATE.CLOSED,
            });
        });
        test("Should throw UnableToUpdateStateCircuitBreakerError when adapter rejects", async () => {
            vi.spyOn(adapter, "updateState").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            const promise = enhanced.updateState(key);

            await expect(promise).rejects.toThrow(
                UnableToUpdateStateCircuitBreakerError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: isolate", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            await expect(enhanced.isolate(key)).resolves.toBeUndefined();
        });
        test("Should throw UnableToIsolateCircuitBreakerError when adapter rejects", async () => {
            vi.spyOn(adapter, "isolate").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            const promise = enhanced.isolate(key);

            await expect(promise).rejects.toThrow(
                UnableToIsolateCircuitBreakerError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: trackFailure", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            await expect(enhanced.trackFailure(key)).resolves.toBeUndefined();
        });
        test("Should throw UnableToTrackFailureCircuitBreakerError when adapter rejects", async () => {
            vi.spyOn(adapter, "trackFailure").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            const promise = enhanced.trackFailure(key);

            await expect(promise).rejects.toThrow(
                UnableToTrackFailureCircuitBreakerError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: trackSuccess", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            await expect(enhanced.trackSuccess(key)).resolves.toBeUndefined();
        });
        test("Should throw UnableToTrackSuccessCircuitBreakerError when adapter rejects", async () => {
            vi.spyOn(adapter, "trackSuccess").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            const promise = enhanced.trackSuccess(key);

            await expect(promise).rejects.toThrow(
                UnableToTrackSuccessCircuitBreakerError,
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
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            await expect(enhanced.reset(key)).resolves.toBeUndefined();
        });
        test("Should throw UnableToResetCircuitBreakerError when adapter rejects", async () => {
            vi.spyOn(adapter, "reset").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedCircuitBreakerAdapterError(),
            );

            const promise = enhanced.reset(key);

            await expect(promise).rejects.toThrow(
                UnableToResetCircuitBreakerError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });
});
