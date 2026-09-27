import { describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module-exports.js";
import { withAfterHookSync } from "@/middleware/implementations/hooks/with-after-hook-sync/with-after-hook-sync.js";

describe("function: withAfterHookSync", () => {
    test("Should run the hook after the wrapped function", () => {
        const order: Array<string> = [];
        const fn = use(
            (name: string): string => {
                order.push("fn");
                return name;
            },
            withAfterHookSync<[string], string>(() => {
                order.push("hook");
            }),
        );
        fn("world");
        expect(order).toEqual(["fn", "hook"]);
    });

    test("Should pass the original arguments and the result to the hook", () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withAfterHookSync<[string], string>(hook),
        );
        fn("world");
        expect(hook).toHaveBeenCalledExactlyOnceWith(["world"], "Hello world");
    });

    test("Should replace the result when the hook returns a value", () => {
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withAfterHookSync<[string], string>(
                ([name]: [string], result: string): string =>
                    `${result} (${name})`,
            ),
        );
        expect(fn("world")).toBe("Hello world (world)");
    });

    test("Should keep the original result when the hook returns nothing", () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withAfterHookSync<[string], string>(hook),
        );
        expect(fn("world")).toBe("Hello world");
        expect(hook).toHaveBeenCalledOnce();
    });

    test("Should return the wrapped function result synchronously", () => {
        const fn = use(
            (name: string): string => name,
            withAfterHookSync<[string], string>(() => {}),
        );
        const result = fn("world");
        expect(result).toBe("world");
        expect(result).not.toBeInstanceOf(Promise);
    });

    test("Should accept an invocable object as hook", () => {
        const invoke = vi.fn((_args: [string], result: string): string =>
            result.toUpperCase(),
        );
        const fn = use(
            (name: string): string => name,
            withAfterHookSync<[string], string>({ invoke }),
        );
        expect(fn("world")).toBe("WORLD");
        expect(invoke).toHaveBeenCalledExactlyOnceWith(["world"], "world");
    });

    test("Should not call the hook when the wrapped function throws", () => {
        const hook = vi.fn();
        const error = new Error("fail");
        const fn = use((): string => {
            throw error;
        }, withAfterHookSync<[], string>(hook));

        expect(() => fn()).toThrow(error);
        expect(hook).not.toHaveBeenCalled();
    });

    test("Should propagate the hook error when the hook throws", () => {
        const hookError = new Error("hook error");
        const fn = use(
            (name: string): string => name,
            withAfterHookSync<[string], string>(() => {
                throw hookError;
            }),
        );
        expect(() => fn("world")).toThrow(hookError);
    });

    test("Should replace the result with a falsy hook returned value", () => {
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withAfterHookSync<[string], string>(() => ""),
        );
        expect(fn("world")).toBe("");
    });

    test("Should keep the original result when the hook returns null", () => {
        const hook = vi.fn().mockReturnValue(null);
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withAfterHookSync<[string], string>(hook),
        );
        expect(fn("world")).toBe("Hello world");
    });

    test("Should keep a falsy wrapped function result when the hook returns nothing", () => {
        const fn = use(
            (): string => "",
            withAfterHookSync<[], string>(() => {}),
        );
        expect(fn()).toBe("");
    });

    test("Should pass every argument of a multi argument tuple", () => {
        const hook = vi.fn();
        const fn = use(
            (a: number, b: number): number => a + b,
            withAfterHookSync<[number, number], number>(hook),
        );
        expect(fn(1, 2)).toBe(3);
        expect(hook).toHaveBeenCalledExactlyOnceWith([1, 2], 3);
    });

    test("Should call the hook on every successful invocation", () => {
        const hook = vi.fn();
        const fn = use(
            (name: string): string => name,
            withAfterHookSync<[string], string>(hook),
        );
        fn("a");
        fn("b");
        expect(hook).toHaveBeenCalledTimes(2);
    });

    test("Should pass the returned promise to the hook when the wrapped function is async", async () => {
        let captured: Promise<string> | undefined = undefined;
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withAfterHookSync<[string], Promise<string>>(
                (_args: [string], result: Promise<string>) => {
                    captured = result;
                },
            ),
        );

        await expect(fn("world")).resolves.toBe("Hello world");
        expect(captured).toBeInstanceOf(Promise);
    });
});
