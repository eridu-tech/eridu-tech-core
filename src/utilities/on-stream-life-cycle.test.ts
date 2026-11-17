import { describe, expect, test, vi } from "vitest";

import { iterableToAsyncIterable } from "@/utilities/functions/iterable-to-async-iterable.js";
import { OnStreamLifeCycle } from "@/utilities/on-stream-life-cycle.js";

describe("class: OnStreamLifeCycle", () => {
    test("Should yield every value of the wrapped iterable in order", async () => {
        const result: Array<number> = [];

        for await (const value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1, 2, 3]),
            onStart: () => {
                // do nothing
            },
            onEnd: () => {
                // do nothing
            },
        })) {
            result.push(value);
        }

        expect(result).toEqual([1, 2, 3]);
    });
    test("Should call onStart before the first value and onEnd after the last value", async () => {
        const events: Array<string> = [];

        function* yieldWithEvents(): Generator<number> {
            events.push("first");
            yield 1;
            events.push("second");
            yield 2;
        }

        for await (const _value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable(yieldWithEvents()),
            onStart: () => {
                events.push("start");
            },
            onEnd: () => {
                events.push("end");
            },
        })) {
            // consume everything
        }

        expect(events).toEqual(["start", "first", "second", "end"]);
    });
    test("Should not call onStart or onEnd when the instance is never iterated", () => {
        const onStart = vi.fn();
        const onEnd = vi.fn();

        new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1, 2, 3]),
            onStart,
            onEnd,
        });

        expect(onStart).not.toHaveBeenCalled();
        expect(onEnd).not.toHaveBeenCalled();
    });
    test("Should await an async onStart before the first value and async onEnd before finishing", async () => {
        const events: Array<string> = [];

        const consume = async () => {
            for await (const value of new OnStreamLifeCycle({
                stream: iterableToAsyncIterable([1]),
                onStart: async () => {
                    await Promise.resolve();
                    events.push("start");
                },
                onEnd: async () => {
                    await Promise.resolve();
                    events.push("end");
                },
            })) {
                events.push(`value:${String(value)}`);
            }
            events.push("finished");
        };

        await consume();

        expect(events).toEqual(["start", "value:1", "end", "finished"]);
    });
    test("Should call onEnd when the consumer stops iterating early", async () => {
        const onEnd = vi.fn();

        for await (const _value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1, 2, 3]),
            onEnd,
        })) {
            break;
        }

        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should call onEnd when the consumer closes the iterator manually", async () => {
        const onEnd = vi.fn();
        const iterator = new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1, 2, 3]),
            onEnd,
        })[Symbol.asyncIterator]();

        await iterator.next();
        await iterator.return?.();

        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should call onStart and onEnd only once when the same instance is iterated twice", async () => {
        const onStart = vi.fn();
        const onEnd = vi.fn();
        const stream = new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1, 2]),
            onStart,
            onEnd,
        });

        for await (const _value of stream) {
            // first consumption
        }
        for await (const _value of stream) {
            // second consumption
        }

        expect(onStart).toHaveBeenCalledOnce();
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
            for await (const _value of new OnStreamLifeCycle({
                stream: iterableToAsyncIterable(yieldThenThrow()),
                onEnd,
            })) {
                // consume until the wrapped iterable throws
            }
        };

        await expect(consume()).rejects.toThrow(error);
        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should call onEnd and not consume the wrapped iterable when onStart throws", async () => {
        const error = new Error("Acquire failed");
        const events: Array<string> = [];
        const onEnd = vi.fn();

        function* yieldWithEvents(): Generator<number> {
            events.push("first");
            yield 1;
        }

        const consume = async () => {
            for await (const _value of new OnStreamLifeCycle({
                stream: iterableToAsyncIterable(yieldWithEvents()),
                onStart: () => {
                    throw error;
                },
                onEnd,
            })) {
                // onStart throws before any value is yielded
            }
        };

        await expect(consume()).rejects.toThrow(error);
        expect(events).toEqual([]);
        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should not retry onStart when it throws", async () => {
        const onStart = vi.fn(() => {
            throw new Error("Acquire failed");
        });
        const stream = new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1]),
            onStart,
        });

        await expect(
            (async () => {
                for await (const _value of stream) {
                    // onStart throws before any value is yielded
                }
            })(),
        ).rejects.toThrow("Acquire failed");

        const result: Array<number> = [];
        for await (const value of stream) {
            // second consumption
            result.push(value);
        }

        expect(result).toEqual([1]);
        expect(onStart).toHaveBeenCalledOnce();
    });
    test("Should rethrow when onEnd throws", async () => {
        const error = new Error("Release failed");

        const consume = async () => {
            for await (const _value of new OnStreamLifeCycle({
                stream: iterableToAsyncIterable([1]),
                onEnd: () => {
                    throw error;
                },
            })) {
                // consume everything
            }
        };

        await expect(consume()).rejects.toThrow(error);
    });
    test("Should yield the values when no callback is provided", async () => {
        const result: Array<number> = [];

        for await (const value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1, 2, 3]),
        })) {
            result.push(value);
        }

        expect(result).toEqual([1, 2, 3]);
    });
    test("Should support an onStart without an onEnd", async () => {
        const onStart = vi.fn();

        for await (const _value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1]),
            onStart,
        })) {
            // consume everything
        }

        expect(onStart).toHaveBeenCalledOnce();
    });
    test("Should support an onEnd without an onStart", async () => {
        const onEnd = vi.fn();

        for await (const _value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1]),
            onEnd,
        })) {
            // consume everything
        }

        expect(onEnd).toHaveBeenCalledOnce();
    });
    test("Should call onBeforeStart before onStart and before the first value", async () => {
        const events: Array<string> = [];

        function* yieldWithEvents(): Generator<number> {
            events.push("first");
            yield 1;
        }

        for await (const _value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable(yieldWithEvents()),
            onBeforeStart: () => {
                events.push("beforeStart");
            },
            onStart: () => {
                events.push("start");
            },
            onEnd: () => {
                events.push("end");
            },
        })) {
            // consume everything
        }

        expect(events).toEqual(["beforeStart", "start", "first", "end"]);
    });
    test("Should not call onBeforeStart when the instance is never iterated", () => {
        const onBeforeStart = vi.fn();

        new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1]),
            onBeforeStart,
        });

        expect(onBeforeStart).not.toHaveBeenCalled();
    });
    test("Should await an async onBeforeStart before calling onStart", async () => {
        const events: Array<string> = [];

        for await (const _value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1]),
            onBeforeStart: async () => {
                await Promise.resolve();
                events.push("beforeStart");
            },
            onStart: () => {
                events.push("start");
            },
        })) {
            // consume everything
        }

        expect(events).toEqual(["beforeStart", "start"]);
    });
    test("Should call onBeforeStart only once when the same instance is iterated twice", async () => {
        const onBeforeStart = vi.fn();
        const stream = new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1]),
            onBeforeStart,
        });

        for await (const _value of stream) {
            // first consumption
        }
        for await (const _value of stream) {
            // second consumption
        }

        expect(onBeforeStart).toHaveBeenCalledOnce();
    });
    test("Should support an onBeforeStart without onStart and onEnd", async () => {
        const onBeforeStart = vi.fn();
        const result: Array<number> = [];

        for await (const value of new OnStreamLifeCycle({
            stream: iterableToAsyncIterable([1, 2]),
            onBeforeStart,
        })) {
            result.push(value);
        }

        expect(result).toEqual([1, 2]);
        expect(onBeforeStart).toHaveBeenCalledOnce();
    });
});
