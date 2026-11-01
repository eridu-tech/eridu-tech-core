import { isClass } from "@/utilities/_module-exports.js";

import type {
    ContextToken,
    DecrementSettings,
    IAsyncContext,
    IAsyncContextChain,
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
 */
export function tokenToString<T>(diToken: ContextToken<T>): string {
    if (isClass(diToken)) {
        return diToken.name;
    }
    return diToken.description;
}

/**
 * @internal
 *
 * Awaitable view over an async context.
 *
 * Every operation is scheduled after the operations that were requested before it,
 * and awaiting the chain resolves once all of them have completed.
 */
export class AsyncContextChain implements IAsyncContextChain {
    private readonly completion: Promise<void> = Promise.resolve();

    constructor(
        private readonly target: IAsyncContext,
        pending: Promise<unknown> = Promise.resolve(),
    ) {
        this.completion = pending.then(() => undefined);
    }

    private next_(operation: () => Promisable<unknown>): IAsyncContextChain {
        return new AsyncContextChain(
            this.target,
            this.completion.then(operation),
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

    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invocable<[value: NoInfer<TValue>], Promisable<boolean>>,
    ): Promise<boolean> {
        return this.target.contains(token, matchValue);
    }

    exists<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return this.target.exists(token);
    }

    missing<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return this.target.missing(token);
    }

    get<TValue>(token: ContextToken<TValue>): Promise<TValue | null> {
        return this.target.get(token);
    }

    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: AsyncLazyable<TValue>,
    ): Promise<TValue> {
        return this.target.getOr(token, defaultValue);
    }

    getOrFail<TValue>(token: ContextToken<TValue>): Promise<TValue> {
        return this.target.getOrFail(token);
    }

    add<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.add(token, value);
        });
    }

    put<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.put(token, value);
        });
    }

    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.putIncrement(token, settings);
        });
    }

    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.putDecrement(token, settings);
        });
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.putPush(token, ...values);
        });
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.update(token, value);
        });
    }

    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.updateIncrement(token, settings);
        });
    }

    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.updateDecrement(token, settings);
        });
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.updatePush(token, ...values);
        });
    }

    remove<TValue>(token: ContextToken<TValue>): IAsyncContextChain {
        return this.next_(() => {
            return this.target.remove(token);
        });
    }

    when(
        condition: AsyncLazyable<boolean>,
        ...invocables: Array<Invocable<[context: IAsyncContext], IAsyncContext>>
    ): IAsyncContextChain {
        return this.next_(() => {
            return this.target.when(condition, ...invocables);
        });
    }
}
