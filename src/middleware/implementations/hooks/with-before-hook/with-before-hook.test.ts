import { describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module-exports.js";
import { withBeforeHook } from "@/middleware/implementations/hooks/with-before-hook/with-before-hook.js";

describe("function: withBeforeHook", () => {
    test("Should run the hook before the wrapped function", async () => {
        const order: Array<string> = [];
        const fn = use(
            (name: string): Promise<string> => {
                order.push("fn");
                return Promise.resolve(name);
            },
            withBeforeHook<[string], string>(([name]: [string]): [string] => {
                order.push("hook");
                return [name];
            }),
        );
        await fn("world");
        expect(order).toEqual(["hook", "fn"]);
    });
    test("Should pass the original arguments to the hook", async () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withBeforeHook<[string], string>(hook),
        );
        await fn("world");
        expect(hook).toHaveBeenCalledExactlyOnceWith(["world"]);
    });
    test("Should replace the arguments passed to the wrapped function", async () => {
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(`Hello ${name}`),
        );
        const fn = use(
            wrappedFn,
            withBeforeHook<[string], string>(([name]: [string]): [string] => [
                name.trim(),
            ]),
        );
        await expect(fn("  world  ")).resolves.toBe("Hello world");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("world");
    });
    test("Should keep the original arguments when the hook returns nothing", async () => {
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const hook = vi.fn();
        const fn = use(wrappedFn, withBeforeHook<[string], string>(hook));
        await expect(fn("world")).resolves.toBe("world");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("world");
        expect(hook).toHaveBeenCalledOnce();
    });
    test("Should await an async hook before calling the wrapped function", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withBeforeHook<[string], string>(
                async ([name]: [string]): Promise<[string]> => {
                    await new Promise((resolve) => setTimeout(resolve, 0));
                    return [name.toUpperCase()];
                },
            ),
        );
        await expect(fn("world")).resolves.toBe("Hello WORLD");
    });
    test("Should not await the hook when detach is true", async () => {
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const hook = vi.fn(async () => {
            await new Promise<void>(() => {});
        });
        const fn = use(wrappedFn, withBeforeHook<[string], string>(hook, true));
        await expect(fn("world")).resolves.toBe("world");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("world");
        expect(hook).toHaveBeenCalledOnce();
    });
    test("Should ignore the hook returned arguments when detach is true", async () => {
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const fn = use(
            wrappedFn,
            withBeforeHook<[string], string>(
                ([name]: [string]): [string] => [name.trim()],
                true,
            ),
        );
        await expect(fn("  world  ")).resolves.toBe("  world  ");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("  world  ");
    });
    test("Should accept an invocable object as hook", async () => {
        const invoke = vi.fn(([name]: [string]): [string] => [name.trim()]);
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withBeforeHook<[string], string>({ invoke }),
        );
        await expect(fn("  world  ")).resolves.toBe("Hello world");
        expect(invoke).toHaveBeenCalledExactlyOnceWith(["  world  "]);
    });
    test("Should not call the wrapped function when the hook throws", async () => {
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const fn = use(
            wrappedFn,
            withBeforeHook<[string], string>(() => {
                throw new Error("hook error");
            }),
        );
        await expect(fn("world")).rejects.toThrow("hook error");
        expect(wrappedFn).not.toHaveBeenCalled();
    });
    test("Should propagate hook errors as-is", async () => {
        const error = new Error("hook error");
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withBeforeHook<[string], string>(() => {
                throw error;
            }),
        );
        await expect(fn("world")).rejects.toBe(error);
    });
    test("Should replace every argument of a multi argument tuple", async () => {
        const wrappedFn = vi.fn((a: number, b: number): Promise<number> =>
            Promise.resolve(a - b),
        );
        const fn = use(
            wrappedFn,
            withBeforeHook<[number, number], number>(
                ([a, b]: [number, number]): [number, number] => [b, a],
            ),
        );
        await expect(fn(1, 2)).resolves.toBe(1);
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith(2, 1);
    });
    test("Should support an empty argument tuple", async () => {
        const wrappedFn = vi.fn((): Promise<string> => Promise.resolve("ok"));
        const hook = vi.fn();
        const fn = use(wrappedFn, withBeforeHook<[], string>(hook));
        await expect(fn()).resolves.toBe("ok");
        expect(hook).toHaveBeenCalledExactlyOnceWith([]);
    });
    test("Should keep the original arguments when the hook returns null", async () => {
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const hook = vi.fn().mockReturnValue(null);
        const fn = use(wrappedFn, withBeforeHook<[string], string>(hook));
        await expect(fn("world")).resolves.toBe("world");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("world");
    });
    test("Should use a falsy hook returned tuple", async () => {
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const fn = use(
            wrappedFn,
            withBeforeHook<[string], string>((): [string] => [""]),
        );
        await expect(fn("world")).resolves.toBe("");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("");
    });
    test("Should call the hook on every invocation", async () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withBeforeHook<[string], string>(hook),
        );
        await fn("a");
        await fn("b");
        expect(hook).toHaveBeenCalledTimes(2);
    });
    test("Should propagate a rejected async hook without calling the wrapped function", async () => {
        const hookError = new Error("hook error");
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const fn = use(
            wrappedFn,
            withBeforeHook<[string], string>(() => Promise.reject(hookError)),
        );
        await expect(fn("world")).rejects.toBe(hookError);
        expect(wrappedFn).not.toHaveBeenCalled();
    });
    test("Should propagate the wrapped function error", async () => {
        const error = new Error("fail");
        const fn = use(
            (_name: string): Promise<string> => Promise.reject(error),
            withBeforeHook<[string], string>(() => {}),
        );
        await expect(fn("world")).rejects.toBe(error);
    });
    test("Should propagate a synchronous hook error when detach is true", async () => {
        const hookError = new Error("hook error");
        const wrappedFn = vi.fn((name: string): Promise<string> =>
            Promise.resolve(name),
        );
        const fn = use(
            wrappedFn,
            withBeforeHook<[string], string>(() => {
                throw hookError;
            }, true),
        );
        await expect(fn("world")).rejects.toBe(hookError);
        expect(wrappedFn).not.toHaveBeenCalled();
    });
});
