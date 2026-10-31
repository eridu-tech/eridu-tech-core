/**
 * @module ExecutionContext
 */

import { ProxyAsyncContextChain } from "@/execution-context/implementations/derivables/di/proxy-execution-context/proxy-async-context-chain.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ContextToken,
    DecrementSettings,
    IAsyncContext,
    IAsyncContextChain,
    IAsyncExecutionContext,
    IncrementSettings,
    PutDecrementSettings,
    PutIncrementSettings,
} from "@/execution-context/contracts/_module-exports.js";
import type {
    AsyncLazyable,
    Invocable,
    Promisable,
} from "@/utilities/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyExecutionContext}.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/di"`
 * @group Derivables
 */
export type ProxyExecutionContextSettings = {
    container: Pick<IServiceResolver, "resolveOrFail">;
    executionContextToken: DiToken<IAsyncExecutionContext>;
};

/**
 * An {@link IAsyncExecutionContext} that resolves the underlying execution context
 * from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyExecutionContextSettings}.
 *
 * The `executionContextToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link IAsyncExecutionContext}. Because resolution happens lazily, every
 * `LIFETIME` is supported:
 *
 * - `SINGLETON` registrations can be used once `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 * - `TRANSIENT` registrations create a new execution context per operation, so context
 *   values are not shared between separate operations. Prefer `SINGLETON` or `SCOPED`.
 *
 * Mutating methods return an {@link IAsyncContextChain} that reuses the resolution of
 * the chain, so chained mutations are applied to the same execution context.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/di"`
 * @group Derivables
 */
export class ProxyExecutionContext implements IAsyncExecutionContext {
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly executionContextToken: DiToken<IAsyncExecutionContext>;

    constructor(settings: ProxyExecutionContextSettings) {
        this.container = settings.container;
        this.executionContextToken = settings.executionContextToken;
    }

    private resolve(): Promise<IAsyncExecutionContext> {
        return this.container.resolveOrFail(this.executionContextToken);
    }

    private chain(
        operation: (
            executionContext: IAsyncExecutionContext,
        ) => Promisable<unknown>,
    ): IAsyncContextChain {
        const executionContext = this.resolve();
        return new ProxyAsyncContextChain(
            executionContext,
            executionContext.then((resolved) => {
                return operation(resolved);
            }),
        );
    }

    async contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invocable<[value: NoInfer<TValue>], Promisable<boolean>>,
    ): Promise<boolean> {
        return (await this.resolve()).contains(token, matchValue);
    }

    async exists<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return (await this.resolve()).exists(token);
    }

    async missing<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return (await this.resolve()).missing(token);
    }

    async get<TValue>(token: ContextToken<TValue>): Promise<TValue | null> {
        return (await this.resolve()).get(token);
    }

    async getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: AsyncLazyable<TValue>,
    ): Promise<TValue> {
        return (await this.resolve()).getOr(token, defaultValue);
    }

    async getOrFail<TValue>(token: ContextToken<TValue>): Promise<TValue> {
        return (await this.resolve()).getOrFail(token);
    }

    add<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.add(token, value);
        });
    }

    put<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.put(token, value);
        });
    }

    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.putIncrement(token, settings);
        });
    }

    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.putDecrement(token, settings);
        });
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.putPush(token, ...values);
        });
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.update(token, value);
        });
    }

    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.updateIncrement(token, settings);
        });
    }

    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.updateDecrement(token, settings);
        });
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.updatePush(token, ...values);
        });
    }

    remove<TValue>(token: ContextToken<TValue>): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.remove(token);
        });
    }

    when(
        condition: AsyncLazyable<boolean>,
        ...invocables: Array<Invocable<[context: IAsyncContext], IAsyncContext>>
    ): IAsyncContextChain {
        return this.chain((executionContext) => {
            return executionContext.when(condition, ...invocables);
        });
    }

    async run<TValue>(
        invocable: Invocable<[], Promisable<TValue>>,
    ): Promise<TValue> {
        return (await this.resolve()).run(invocable);
    }
}
