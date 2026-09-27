import { describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module-exports.js";
import { withOnErrorSync } from "@/middleware/implementations/hooks/with-on-error-hook-sync/with-on-error-hook-sync.js";

describe("function: withOnErrorSync", () => {
    test("Should pass the original arguments and the error to the hook", () => {
        const error = new Error("fail");
        const hook = vi.fn();
        const fn = use((): string => {
            throw error;
        }, withOnErrorSync<[], string>(hook));

        expect(() => fn()).toThrow(error);
        expect(hook).toHaveBeenCalledExactlyOnceWith([], error);
    });

    test("Should re-throw the original error as-is", () => {
        const error = new Error("fail");
        const fn = use(
            (): string => {
                throw error;
            },
            withOnErrorSync<[], string>(() => {}),
        );

        let caught: unknown;
        try {
            fn();
        } catch (error_: unknown) {
            caught = error_;
        }
        expect(caught).toBe(error);
    });

    test("Should not call the hook when the wrapped function succeeds", () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withOnErrorSync<[string], string>(hook),
        );
        expect(fn("world")).toBe("Hello world");
        expect(hook).not.toHaveBeenCalled();
    });

    test("Should return the result when the wrapped function succeeds", () => {
        const fn = use(
            (name: string): string => name,
            withOnErrorSync<[string], string>(() => {}),
        );
        expect(fn("world")).toBe("world");
    });

    test("Should return the wrapped function result synchronously", () => {
        const fn = use(
            (name: string): string => name,
            withOnErrorSync<[string], string>(() => {}),
        );
        const result = fn("world");
        expect(result).toBe("world");
        expect(result).not.toBeInstanceOf(Promise);
    });

    test("Should accept an invocable object as hook", () => {
        const error = new Error("fail");
        const invoke = vi.fn();
        const fn = use((): string => {
            throw error;
        }, withOnErrorSync<[], string>({ invoke }));

        expect(() => fn()).toThrow(error);
        expect(invoke).toHaveBeenCalledExactlyOnceWith([], error);
    });

    test("Should call the hook for every failed invocation", () => {
        const hook = vi.fn();
        const fn = use((): string => {
            throw new Error("fail");
        }, withOnErrorSync<[], string>(hook));
        expect(() => fn()).toThrow("fail");
        expect(() => fn()).toThrow("fail");
        expect(hook).toHaveBeenCalledTimes(2);
    });

    test("Should ignore the hook returned value and still re-throw", () => {
        const error = new Error("fail");
        const hook = vi.fn().mockReturnValue("recovered");
        const fn = use((): string => {
            throw error;
        }, withOnErrorSync<[], string>(hook));

        let caught: unknown;
        try {
            fn();
        } catch (error_: unknown) {
            caught = error_;
        }
        expect(caught).toBe(error);
        expect(hook).toHaveBeenCalledOnce();
    });

    test("Should pass and re-throw non-error thrown values", () => {
        const hook = vi.fn();
        const fn = use((): string => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw "failure";
        }, withOnErrorSync<[], string>(hook));

        let caught: unknown;
        try {
            fn();
        } catch (error_: unknown) {
            caught = error_;
        }
        expect(caught).toBe("failure");
        expect(hook).toHaveBeenCalledExactlyOnceWith([], "failure");
    });

    test("Should catch an error thrown by the wrapped function", () => {
        const error = new Error("fail");
        const hook = vi.fn();
        const fn = use((_name: string): string => {
            throw error;
        }, withOnErrorSync<[string], string>(hook));

        expect(() => fn("world")).toThrow(error);
        expect(hook).toHaveBeenCalledExactlyOnceWith(["world"], error);
    });

    test("Should pass every argument of a multi argument tuple", () => {
        const hook = vi.fn();
        const error = new Error("fail");
        const fn = use((_a: number, _b: number): number => {
            throw error;
        }, withOnErrorSync<[number, number], number>(hook));

        expect(() => fn(1, 2)).toThrow(error);
        expect(hook).toHaveBeenCalledExactlyOnceWith([1, 2], error);
    });

    test("Should propagate the hook error when the hook throws", () => {
        const hookError = new Error("hook error");
        const fn = use(
            (): string => {
                throw new Error("fail");
            },
            withOnErrorSync<[], string>(() => {
                throw hookError;
            }),
        );
        expect(() => fn()).toThrow(hookError);
    });

    test("Should not catch errors from an async wrapped function", async () => {
        const error = new Error("fail");
        const hook = vi.fn();
        const fn = use(
            (_name: string): Promise<string> => Promise.reject(error),
            withOnErrorSync<[string], Promise<string>>(hook),
        );

        await expect(fn("world")).rejects.toBe(error);
        expect(hook).not.toHaveBeenCalled();
    });
});
