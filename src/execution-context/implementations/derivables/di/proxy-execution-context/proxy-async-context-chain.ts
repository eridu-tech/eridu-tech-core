/**
 * @module ExecutionContext
 */

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
 * @internal
 *
 * Awaitable view over an execution context that is resolved from a DI container.
 *
 * Every operation is scheduled after the operations that were requested before it,
 * and awaiting the chain resolves once all of them have completed.
 */
export class ProxyAsyncContextChain implements IAsyncContextChain {
    private readonly completion: Promise<void>;

    constructor(
        private readonly executionContext: Promise<IAsyncExecutionContext>,
        pending: Promise<unknown> = Promise.resolve(),
    ) {
        this.completion = pending.then(() => undefined);
    }

    private next_(
        operation: (
            executionContext: IAsyncExecutionContext,
        ) => Promisable<unknown>,
    ): IAsyncContextChain {
        return new ProxyAsyncContextChain(
            this.executionContext,
            this.completion.then(async () => {
                return await operation(await this.executionContext);
            }),
        );
    }

    then<TResult1 = void, TResult2 = never>(
        onfulfilled?:
            // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
            ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return this.completion.then(onfulfilled, onrejected);
    }

    async contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invocable<[value: NoInfer<TValue>], Promisable<boolean>>,
    ): Promise<boolean> {
        return (await this.executionContext).contains(token, matchValue);
    }

    async exists<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return (await this.executionContext).exists(token);
    }

    async missing<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return (await this.executionContext).missing(token);
    }

    async get<TValue>(token: ContextToken<TValue>): Promise<TValue | null> {
        return (await this.executionContext).get(token);
    }

    async getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: AsyncLazyable<TValue>,
    ): Promise<TValue> {
        return (await this.executionContext).getOr(token, defaultValue);
    }

    async getOrFail<TValue>(token: ContextToken<TValue>): Promise<TValue> {
        return (await this.executionContext).getOrFail(token);
    }

    add<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.add(token, value);
        });
    }

    put<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.put(token, value);
        });
    }

    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.putIncrement(token, settings);
        });
    }

    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.putDecrement(token, settings);
        });
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.putPush(token, ...values);
        });
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.update(token, value);
        });
    }

    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.updateIncrement(token, settings);
        });
    }

    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.updateDecrement(token, settings);
        });
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.updatePush(token, ...values);
        });
    }

    remove<TValue>(token: ContextToken<TValue>): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.remove(token);
        });
    }

    when(
        condition: AsyncLazyable<boolean>,
        ...invocables: Array<Invocable<[context: IAsyncContext], IAsyncContext>>
    ): IAsyncContextChain {
        return this.next_((executionContext) => {
            return executionContext.when(condition, ...invocables);
        });
    }
}
