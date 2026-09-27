import { describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module-exports.js";
import { withOnError } from "@/middleware/implementations/hooks/with-on-error-hook/with-on-error-hook.js";

describe("function: withOnError", () => {
    test("Should pass the original arguments and the error to the hook", async () => {
        const error = new Error("fail");
        const hook = vi.fn();
        const fn = use(
            (): Promise<string> => Promise.reject(error),
            withOnError<[], string>(hook),
        );
        await expect(fn()).rejects.toBe(error);
        expect(hook).toHaveBeenCalledExactlyOnceWith([], error);
    });
    test("Should re-throw the original error as-is", async () => {
        const error = new Error("fail");
        const fn = use(
            (): Promise<string> => Promise.reject(error),
            withOnError<[], string>(() => {}),
        );
        await expect(fn()).rejects.toBe(error);
    });
    test("Should not call the hook when the wrapped function succeeds", async () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withOnError<[string], string>(hook),
        );
        await expect(fn("world")).resolves.toBe("Hello world");
        expect(hook).not.toHaveBeenCalled();
    });
    test("Should return the result when the wrapped function succeeds", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withOnError<[string], string>(() => {}),
        );
        await expect(fn("world")).resolves.toBe("world");
    });
    test("Should await an async hook before re-throwing", async () => {
        const order: Array<string> = [];
        const fn = use(
            (): Promise<string> => Promise.reject(new Error("fail")),
            withOnError<[], string>(async () => {
                await new Promise((resolve) => setTimeout(resolve, 0));
                order.push("hook");
            }),
        );
        await expect(fn()).rejects.toThrow("fail");
        expect(order).toEqual(["hook"]);
    });
    test("Should not await the hook when detach is true", async () => {
        const error = new Error("fail");
        const hook = vi.fn(async () => {
            await new Promise<void>(() => {});
        });
        const fn = use(
            (): Promise<string> => Promise.reject(error),
            withOnError<[], string>(hook, true),
        );
        await expect(fn()).rejects.toBe(error);
        expect(hook).toHaveBeenCalledExactlyOnceWith([], error);
    });
    test("Should accept an invocable object as hook", async () => {
        const error = new Error("fail");
        const invoke = vi.fn();
        const fn = use(
            (): Promise<string> => Promise.reject(error),
            withOnError<[], string>({ invoke }),
        );
        await expect(fn()).rejects.toBe(error);
        expect(invoke).toHaveBeenCalledExactlyOnceWith([], error);
    });
    test("Should call the hook for every failed invocation", async () => {
        const hook = vi.fn();
        const fn = use(
            (): Promise<string> => Promise.reject(new Error("fail")),
            withOnError<[], string>(hook),
        );
        await expect(fn()).rejects.toThrow("fail");
        await expect(fn()).rejects.toThrow("fail");
        expect(hook).toHaveBeenCalledTimes(2);
    });
    test("Should ignore the hook returned value and still re-throw", async () => {
        const error = new Error("fail");
        const hook = vi.fn().mockReturnValue("recovered");
        const fn = use(
            (): Promise<string> => Promise.reject(error),
            withOnError<[], string>(hook),
        );
        await expect(fn()).rejects.toBe(error);
        expect(hook).toHaveBeenCalledOnce();
    });
    test("Should pass and re-throw non-error thrown values", async () => {
        const hook = vi.fn();
        const fn = use(
            (): Promise<string> =>
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                Promise.reject("failure"),
            withOnError<[], string>(hook),
        );
        await expect(fn()).rejects.toBe("failure");
        expect(hook).toHaveBeenCalledExactlyOnceWith([], "failure");
    });
    test("Should catch an error thrown synchronously by the wrapped function", async () => {
        const error = new Error("fail");
        const hook = vi.fn();
        const fn = use((): Promise<string> => {
            throw error;
        }, withOnError<[], string>(hook));
        await expect(fn()).rejects.toBe(error);
        expect(hook).toHaveBeenCalledExactlyOnceWith([], error);
    });
    test("Should pass every argument of a multi argument tuple", async () => {
        const hook = vi.fn();
        const fn = use(
            (_a: number, _b: number): Promise<number> =>
                Promise.reject(new Error("fail")),
            withOnError<[number, number], number>(hook),
        );
        await expect(fn(1, 2)).rejects.toThrow("fail");
        expect(hook).toHaveBeenCalledExactlyOnceWith([1, 2], expect.any(Error));
    });
    test("Should propagate the hook error when the hook throws", async () => {
        const hookError = new Error("hook error");
        const fn = use(
            (): Promise<string> => Promise.reject(new Error("fail")),
            withOnError<[], string>(() => {
                throw hookError;
            }),
        );
        await expect(fn()).rejects.toBe(hookError);
    });
    test("Should propagate a rejected async hook", async () => {
        const hookError = new Error("hook error");
        const fn = use(
            (): Promise<string> => Promise.reject(new Error("fail")),
            withOnError<[], string>(() => Promise.reject(hookError)),
        );
        await expect(fn()).rejects.toBe(hookError);
    });
    test("Should propagate a synchronous hook error when detach is true", async () => {
        const hookError = new Error("hook error");
        const fn = use(
            (): Promise<string> => Promise.reject(new Error("fail")),
            withOnError<[], string>(() => {
                throw hookError;
            }, true),
        );
        await expect(fn()).rejects.toBe(hookError);
    });
});
