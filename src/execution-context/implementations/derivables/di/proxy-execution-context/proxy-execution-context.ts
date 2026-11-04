/**
 * @module ExecutionContext
 */

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ContextToken,
    DecrementSettings,
    IContext,
    IExecutionContext,
    IncrementSettings,
    PutDecrementSettings,
    PutIncrementSettings,
} from "@/execution-context/contracts/_module-exports.js";
import type {
    Lazyable,
    Invocable,
    InvocableFn,
} from "@/utilities/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyExecutionContext}.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/di"`
 * @group Derivables
 */
export type ProxyExecutionContextSettings = {
    container: Pick<IServiceResolver, "resolveOrFail">;
    executionContextToken: DiToken<IExecutionContext>;
};

/**
 * An {@link IExecutionContext} that resolves the underlying execution context
 * from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyExecutionContextSettings}.
 *
 * The `executionContextToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link IExecutionContext}. Because resolution happens lazily, every
 * `LIFETIME` is supported:
 *
 * - `SINGLETON` registrations can be used once `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 * - `TRANSIENT` registrations create a new execution context per operation, so context
 *   values are not shared between separate operations. Prefer `SINGLETON` or `SCOPED`.
 *
 * Mutating methods return an {@link IContextChain} that reuses the resolution of
 * the chain, so chained mutations are applied to the same execution context.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/di"`
 * @group Derivables
 */
export class ProxyExecutionContext implements IExecutionContext {
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly executionContextToken: DiToken<IExecutionContext>;

    constructor(settings: ProxyExecutionContextSettings) {
        this.container = settings.container;
        this.executionContextToken = settings.executionContextToken;
    }

    run<TValue>(invocable: Invocable<[], TValue>): TValue {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .run(invocable);
    }

    bind<TArgs extends Array<unknown>, TReturn>(
        fn: Invocable<[...args: TArgs], TReturn>,
    ): InvocableFn<[...args: TArgs], TReturn> {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .bind(fn);
    }

    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            NoInfer<TValue> | Invocable<[value: NoInfer<TValue>], boolean>,
    ): boolean {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .contains(token, matchValue);
    }

    exists<TValue>(token: ContextToken<TValue>): boolean {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .exists(token);
    }

    missing<TValue>(token: ContextToken<TValue>): boolean {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .missing(token);
    }

    get<TValue>(token: ContextToken<TValue>): TValue | null {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .get(token);
    }

    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: Lazyable<TValue>,
    ): TValue {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .getOr(token, defaultValue);
    }

    getOrFail<TValue>(token: ContextToken<TValue>): TValue {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .getOrFail(token);
    }

    add<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .add(token, value);
    }

    put<TValue>(token: ContextToken<TValue>, value: NoInfer<TValue>): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .put(token, value);
    }

    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .putIncrement(token, settings);
    }

    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .putDecrement(token, settings);
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .putPush(token, ...values);
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .update(token, value);
    }

    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .updateIncrement(token, settings);
    }

    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .updateDecrement(token, settings);
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .updatePush(token, ...values);
    }

    remove<TValue>(token: ContextToken<TValue>): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .remove(token);
    }

    when(
        condition: Lazyable<boolean>,
        ...invocables: Array<Invocable<[context: IContext], IContext>>
    ): IContext {
        return this.container
            .resolveOrFail(this.executionContextToken)
            .when(condition, ...invocables);
    }
}
