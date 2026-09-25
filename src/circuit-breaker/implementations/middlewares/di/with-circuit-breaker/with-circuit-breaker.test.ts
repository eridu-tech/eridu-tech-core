import { beforeEach, describe, expect, test, vi } from "vitest";

import { CIRCUIT_BREAKER_TRIGGER } from "@/circuit-breaker/contracts/_module.js";
import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/_module.js";
import { CircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import { CircuitBreaker } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { registerWithCircuitBreaker } from "@/circuit-breaker/implementations/middlewares/di/with-circuit-breaker/with-circuit-breaker.js";
import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type {
    CircuitBreakerFactoryCreateSettings,
    ICircuitBreakerFactory,
} from "@/circuit-breaker/contracts/_module.js";
import type { IContainer } from "@/di/contracts/container.contract.js";

describe("function: registerWithCircuitBreaker", () => {
    const CIRCUIT_BREAKER_FACTORY = genericToken<ICircuitBreakerFactory>(
        "ICircuitBreakerFactory",
    );

    let container: IContainer;
    let circuitBreakerFactory: CircuitBreakerFactory;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        circuitBreakerFactory = new CircuitBreakerFactory({
            adapter: new NoOpCircuitBreakerAdapter(),
        });
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({
            token: CIRCUIT_BREAKER_FACTORY,
            value: circuitBreakerFactory,
        });
        await container.init();
    });

    test("Should resolve the circuit-breaker factory token and call create with the key and settings", async () => {
        const spy = vi.spyOn(circuitBreakerFactory, "create");

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const settings: CircuitBreakerFactoryCreateSettings = {
            errorPolicy: Error,
            slowCallTime: TimeSpan.fromMinutes(1),
            trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
        };
        await use(
            fn,
            registerWithCircuitBreaker(
                container,
                CIRCUIT_BREAKER_FACTORY,
            )({
                ...settings,
                key: ([value]) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledExactlyOnceWith(key, settings);
    });
    test("Should call CircuitBreaker.runOrFail method", async () => {
        const spy = vi.spyOn(CircuitBreaker.prototype, "runOrFail");

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            registerWithCircuitBreaker(
                container,
                CIRCUIT_BREAKER_FACTORY,
            )({
                key: ([value]) => value,
            }),
        )("value");

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithCircuitBreaker(
                container,
                CIRCUIT_BREAKER_FACTORY,
            )({
                key: ([value]) => value,
            }),
        );

        await wrapped("a");
        await wrapped("b");

        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            registerWithCircuitBreaker(
                container,
                CIRCUIT_BREAKER_FACTORY,
            )({
                key: ([a, b]) => `${a}:${b}`,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<ICircuitBreakerFactory>(
            "IUnregisteredCircuitBreakerFactory",
        );

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithCircuitBreaker(
                container,
                unregisteredToken,
            )({
                key: ([value]) => value,
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
