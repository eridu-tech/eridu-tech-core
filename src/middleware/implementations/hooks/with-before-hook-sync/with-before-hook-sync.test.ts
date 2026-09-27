import { describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module-exports.js";
import { withBeforeHookSync } from "@/middleware/implementations/hooks/with-before-hook-sync/with-before-hook-sync.js";

describe("function: withBeforeHookSync", () => {
    test("Should run the hook before the wrapped function", () => {
        const order: Array<string> = [];
        const fn = use(
            (name: string): string => {
                order.push("fn");
                return name;
            },
            withBeforeHookSync<[string], string>(
                ([name]: [string]): [string] => {
                    order.push("hook");
                    return [name];
                },
            ),
        );
        fn("world");
        expect(order).toEqual(["hook", "fn"]);
    });

    test("Should pass the original arguments to the hook", () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): string => name,
            withBeforeHookSync<[string], string>(hook),
        );
        fn("world");
        expect(hook).toHaveBeenCalledExactlyOnceWith(["world"]);
    });

    test("Should replace the arguments passed to the wrapped function", () => {
        const wrappedFn = vi.fn((name: string): string => `Hello ${name}`);
        const fn = use(
            wrappedFn,
            withBeforeHookSync<[string], string>(
                ([name]: [string]): [string] => [name.trim()],
            ),
        );
        expect(fn("  world  ")).toBe("Hello world");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("world");
    });

    test("Should keep the original arguments when the hook returns nothing", () => {
        const wrappedFn = vi.fn((name: string): string => name);
        const hook = vi.fn();
        const fn = use(wrappedFn, withBeforeHookSync<[string], string>(hook));
        expect(fn("world")).toBe("world");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("world");
        expect(hook).toHaveBeenCalledOnce();
    });

    test("Should return the wrapped function result synchronously", () => {
        const fn = use(
            (name: string): string => name,
            withBeforeHookSync<[string], string>(() => {}),
        );
        const result = fn("world");
        expect(result).toBe("world");
        expect(result).not.toBeInstanceOf(Promise);
    });

    test("Should accept an invocable object as hook", () => {
        const invoke = vi.fn(([name]: [string]): [string] => [name.trim()]);
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withBeforeHookSync<[string], string>({ invoke }),
        );
        expect(fn("  world  ")).toBe("Hello world");
        expect(invoke).toHaveBeenCalledExactlyOnceWith(["  world  "]);
    });

    test("Should not call the wrapped function when the hook throws", () => {
        const wrappedFn = vi.fn((name: string): string => name);
        const fn = use(
            wrappedFn,
            withBeforeHookSync<[string], string>(() => {
                throw new Error("hook error");
            }),
        );
        expect(() => fn("world")).toThrow("hook error");
        expect(wrappedFn).not.toHaveBeenCalled();
    });

    test("Should propagate hook errors as-is", () => {
        const error = new Error("hook error");
        const fn = use(
            (name: string): string => name,
            withBeforeHookSync<[string], string>(() => {
                throw error;
            }),
        );

        let caught: unknown;
        try {
            fn("world");
        } catch (error_: unknown) {
            caught = error_;
        }
        expect(caught).toBe(error);
    });

    test("Should replace every argument of a multi argument tuple", () => {
        const wrappedFn = vi.fn((a: number, b: number): number => a - b);
        const fn = use(
            wrappedFn,
            withBeforeHookSync<[number, number], number>(
                ([a, b]: [number, number]): [number, number] => [b, a],
            ),
        );
        expect(fn(1, 2)).toBe(1);
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith(2, 1);
    });

    test("Should support an empty argument tuple", () => {
        const wrappedFn = vi.fn((): string => "ok");
        const hook = vi.fn();
        const fn = use(wrappedFn, withBeforeHookSync<[], string>(hook));
        expect(fn()).toBe("ok");
        expect(hook).toHaveBeenCalledExactlyOnceWith([]);
    });

    test("Should keep the original arguments when the hook returns null", () => {
        const wrappedFn = vi.fn((name: string): string => name);
        const hook = vi.fn().mockReturnValue(null);
        const fn = use(wrappedFn, withBeforeHookSync<[string], string>(hook));
        expect(fn("world")).toBe("world");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("world");
    });

    test("Should use a falsy hook returned tuple", () => {
        const wrappedFn = vi.fn((name: string): string => name);
        const fn = use(
            wrappedFn,
            withBeforeHookSync<[string], string>((): [string] => [""]),
        );
        expect(fn("world")).toBe("");
        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("");
    });

    test("Should call the hook on every invocation", () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): string => name,
            withBeforeHookSync<[string], string>(hook),
        );
        fn("a");
        fn("b");
        expect(hook).toHaveBeenCalledTimes(2);
    });

    test("Should propagate the wrapped function error", () => {
        const error = new Error("fail");
        const fn = use(
            (_name: string): string => {
                throw error;
            },
            withBeforeHookSync<[string], string>(() => {}),
        );
        expect(() => fn("world")).toThrow(error);
    });

    test("Should work with an async wrapped function", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withBeforeHookSync<[string], Promise<string>>(
                ([name]: [string]): [string] => [name.trim()],
            ),
        );
        await expect(fn("  world  ")).resolves.toBe("Hello world");
    });
});
