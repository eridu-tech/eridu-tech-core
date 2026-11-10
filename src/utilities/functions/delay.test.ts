import { afterEach, describe, expect, test, vi } from "vitest";

import { TimeSpan } from "@/time-span/implementations/time-span.js";
import { delay } from "@/utilities/functions/delay.js";

describe("function: delay", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("Should resolve after the given time", async () => {
        vi.useFakeTimers();
        let settled = false;

        const promise = delay(TimeSpan.fromMilliseconds(100)).then(() => {
            settled = true;
        });

        await vi.advanceTimersByTimeAsync(99);
        expect(settled).toBe(false);

        await vi.advanceTimersByTimeAsync(1);
        await promise;
        expect(settled).toBe(true);
    });
    test("Should resolve without a signal", async () => {
        vi.useFakeTimers();
        let settled = false;

        const promise = delay(TimeSpan.fromMilliseconds(5)).then(() => {
            settled = true;
        });

        await vi.advanceTimersByTimeAsync(5);
        await promise;

        expect(settled).toBe(true);
    });
    test("Should reject with the abort reason when the signal is already aborted", async () => {
        const controller = new AbortController();
        const reason = new Error("stopped");
        controller.abort(reason);

        await expect(
            delay(TimeSpan.fromMilliseconds(100), controller.signal),
        ).rejects.toBe(reason);
    });
    test("Should reject with the abort reason when aborted while waiting", async () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        const reason = new Error("stopped");

        const promise = delay(
            TimeSpan.fromMilliseconds(1000),
            controller.signal,
        );
        await vi.advanceTimersByTimeAsync(10);
        controller.abort(reason);

        await expect(promise).rejects.toBe(reason);
    });
    test("Should clear the pending timer when aborted", async () => {
        vi.useFakeTimers();
        const controller = new AbortController();

        const promise = delay(
            TimeSpan.fromMilliseconds(1000),
            controller.signal,
        );
        controller.abort(new Error("stopped"));

        await expect(promise).rejects.toThrow("stopped");
        expect(vi.getTimerCount()).toBe(0);
    });
    test("Should not resolve after the signal is aborted", async () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        let settled = false;

        const promise = delay(
            TimeSpan.fromMilliseconds(1000),
            controller.signal,
        ).then(
            () => {
                settled = true;
            },
            () => {},
        );
        controller.abort(new Error("stopped"));
        await vi.advanceTimersByTimeAsync(1000);
        await promise;

        expect(settled).toBe(false);
    });
});
