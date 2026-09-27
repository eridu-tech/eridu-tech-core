import { describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module-exports.js";
import { withAfterHook } from "@/middleware/implementations/hooks/with-after-hook/with-after-hook.js";

describe("function: withAfterHook", () => {
    test("Should run the hook after the wrapped function", async () => {
        const order: Array<string> = [];
        const fn = use(
            (name: string): Promise<string> => {
                order.push("fn");
                return Promise.resolve(name);
            },
            withAfterHook<[string], string>(() => {
                order.push("hook");
            }),
        );
        await fn("world");
        expect(order).toEqual(["fn", "hook"]);
    });
    test("Should pass the original arguments and the result to the hook", async () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withAfterHook<[string], string>(hook),
        );
        await fn("world");
        expect(hook).toHaveBeenCalledExactlyOnceWith(["world"], "Hello world");
    });
    test("Should replace the result when the hook returns a value", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withAfterHook<[string], string>(
                ([name]: [string], result: string): string =>
                    `${result} (${name})`,
            ),
        );
        await expect(fn("world")).resolves.toBe("Hello world (world)");
    });
    test("Should keep the original result when the hook returns nothing", async () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withAfterHook<[string], string>(hook),
        );
        await expect(fn("world")).resolves.toBe("Hello world");
        expect(hook).toHaveBeenCalledOnce();
    });
    test("Should await an async hook before returning the result", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>(
                async (_args: [string], result: string): Promise<string> => {
                    await new Promise((resolve) => setTimeout(resolve, 0));
                    return result.toUpperCase();
                },
            ),
        );
        await expect(fn("world")).resolves.toBe("WORLD");
    });
    test("Should not await the hook when detach is true", async () => {
        const hook = vi.fn(async () => {
            await new Promise<void>(() => {});
        });
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>(hook, true),
        );
        await expect(fn("world")).resolves.toBe("world");
        expect(hook).toHaveBeenCalledExactlyOnceWith(["world"], "world");
    });
    test("Should ignore the hook returned result when detach is true", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>(
                (_args: [string], _result: string): string => "modified",
                true,
            ),
        );
        await expect(fn("world")).resolves.toBe("world");
    });
    test("Should accept an invocable object as hook", async () => {
        const invoke = vi.fn((_args: [string], result: string): string =>
            result.toUpperCase(),
        );
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>({ invoke }),
        );
        await expect(fn("world")).resolves.toBe("WORLD");
        expect(invoke).toHaveBeenCalledExactlyOnceWith(["world"], "world");
    });
    test("Should not call the hook when the wrapped function throws", async () => {
        const hook = vi.fn();
        const error = new Error("fail");
        const fn = use(
            (): Promise<string> => Promise.reject(error),
            withAfterHook<[], string>(hook),
        );
        await expect(fn()).rejects.toBe(error);
        expect(hook).not.toHaveBeenCalled();
    });
    test("Should propagate the hook error when the hook throws", async () => {
        const hookError = new Error("hook error");
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>(() => {
                throw hookError;
            }),
        );
        await expect(fn("world")).rejects.toBe(hookError);
    });
    test("Should propagate a rejected async hook", async () => {
        const hookError = new Error("hook error");
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>(() => Promise.reject(hookError)),
        );
        await expect(fn("world")).rejects.toBe(hookError);
    });
    test("Should propagate a synchronous hook error when detach is true", async () => {
        const hookError = new Error("hook error");
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>(() => {
                throw hookError;
            }, true),
        );
        await expect(fn("world")).rejects.toBe(hookError);
    });
    test("Should replace the result with a falsy hook returned value", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withAfterHook<[string], string>(() => ""),
        );
        await expect(fn("world")).resolves.toBe("");
    });
    test("Should keep the original result when the hook returns null", async () => {
        const hook = vi.fn().mockReturnValue(null);
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withAfterHook<[string], string>(hook),
        );
        await expect(fn("world")).resolves.toBe("Hello world");
    });
    test("Should keep a falsy wrapped function result when the hook returns nothing", async () => {
        const fn = use(
            (): Promise<string> => Promise.resolve(""),
            withAfterHook<[], string>(() => {}),
        );
        await expect(fn()).resolves.toBe("");
    });
    test("Should pass every argument of a multi argument tuple", async () => {
        const hook = vi.fn();
        const fn = use(
            (a: number, b: number): Promise<number> => Promise.resolve(a + b),
            withAfterHook<[number, number], number>(hook),
        );
        await expect(fn(1, 2)).resolves.toBe(3);
        expect(hook).toHaveBeenCalledExactlyOnceWith([1, 2], 3);
    });
    test("Should call the hook on every successful invocation", async () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withAfterHook<[string], string>(hook),
        );
        await fn("a");
        await fn("b");
        expect(hook).toHaveBeenCalledTimes(2);
    });
});
