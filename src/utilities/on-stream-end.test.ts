import { describe, expect, test, vi } from "vitest";

import { iterableToAsyncIterable } from "@/utilities/functions/iterable-to-async-iterable.js";
import { OnStreamEnd } from "@/utilities/on-stream-end.js";

describe("class: OnStreamEnd", () => {
    test("Should yield every value of the wrapped iterable in order", async () => {
        const result: Array<number> = [];
        const onEnd = () => {
            // do nothing
        };

        for await (const value of new OnStreamEnd(
            iterableToAsyncIterable([1, 2, 3]),
            onEnd,
        )) {
            result.push(value);
        }

        expect(result).toEqual([1, 2, 3]);
    });
    test("Should call onEnd only after the wrapped iterable is fully consumed", async () => {
        const events: Array<string> = [];

        function* yieldWithEvents(): Generator<number> {
            events.push("first");
            yield 1;
            events.push("second");
            yield 2;
        }

        for await (const _value of new OnStreamEnd(
            iterableToAsyncIterable(yieldWithEvents()),
            () => {
                events.push("end");
            },
        )) {
            // consume everything
        }

        expect(events).toEqual(["first", "second", "end"]);
    });
    test("Should call onEnd when the consumer stops iterating early", async () => {
        const onEnd = vi.fn();

        for await (const _value of new OnStreamEnd(
            iterableToAsyncIterable([1, 2, 3]),
            onEnd,
        )) {
            break;
        }

        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should call onEnd when the consumer closes the iterator manually", async () => {
        const onEnd = vi.fn();
        const iterator = new OnStreamEnd(
            iterableToAsyncIterable([1, 2, 3]),
            onEnd,
        )[Symbol.asyncIterator]();

        await iterator.next();
        await iterator.return?.();

        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should call onEnd and rethrow when the wrapped iterable throws", async () => {
        const error = new Error("Stream failed");
        const onEnd = vi.fn();

        function* yieldThenThrow(): Generator<number> {
            yield 1;
            throw error;
        }

        const consume = async () => {
            for await (const _value of new OnStreamEnd(
                iterableToAsyncIterable(yieldThenThrow()),
                onEnd,
            )) {
                // consume until the wrapped iterable throws
            }
        };

        await expect(consume()).rejects.toThrow(error);
        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should await an async onEnd before finishing the iteration", async () => {
        let isEnded = false;

        const consume = async () => {
            for await (const _value of new OnStreamEnd(
                iterableToAsyncIterable([1]),
                async () => {
                    await Promise.resolve();
                    isEnded = true;
                },
            )) {
                // consume everything
            }
            return isEnded;
        };

        await expect(consume()).resolves.toBe(true);
    });
    test("Should call onEnd only once when the same instance is iterated twice", async () => {
        const onEnd = vi.fn();
        const stream = new OnStreamEnd(iterableToAsyncIterable([1, 2]), onEnd);

        for await (const _value of stream) {
            // first consumption
        }
        for await (const _value of stream) {
            // second consumption
        }

        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should rethrow when onEnd throws", async () => {
        const error = new Error("Release failed");

        const consume = async () => {
            for await (const _value of new OnStreamEnd(
                iterableToAsyncIterable([1]),
                () => {
                    throw error;
                },
            )) {
                // consume everything
            }
        };

        await expect(consume()).rejects.toThrow(error);
    });
});
