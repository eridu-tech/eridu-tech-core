/**
 * @module ExecutionContext
 */

import { NotFoundExecutionContextError } from "@/execution-context/contracts/execution-context.errors.js";
import {
    AsyncContextChain,
    tokenToString,
} from "@/execution-context/implementations/derivables/async-execution-context/_shared.js";
import { resolveAsyncLazyable } from "@/utilities/_module-exports.js";

import type {
    ContextToken,
    DecrementSettings,
    IAsyncContext,
    IAsyncContextChain,
    IAsyncCopyableContext,
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
export class NoOpAsyncContext implements IAsyncCopyableContext {
    copy(): IAsyncCopyableContext {
        return new NoOpAsyncContext();
    }

    contains<TValue>(
        _token: ContextToken<Array<TValue>>,
        _matchValue:
            | NoInfer<TValue>
            | Invocable<[value: NoInfer<TValue>], Promisable<boolean>>,
    ): Promise<boolean> {
        return Promise.resolve(false);
    }

    exists<TValue>(_token: ContextToken<TValue>): Promise<boolean> {
        return Promise.resolve(false);
    }

    missing<TValue>(_token: ContextToken<TValue>): Promise<boolean> {
        return Promise.resolve(true);
    }

    get<TValue>(_token: ContextToken<TValue>): Promise<TValue | null> {
        return Promise.resolve(null);
    }

    getOr<TValue>(
        _token: ContextToken<TValue>,
        defaultValue: AsyncLazyable<TValue>,
    ): Promise<TValue> {
        return resolveAsyncLazyable(defaultValue);
    }

    getOrFail<TValue>(token: ContextToken<TValue>): Promise<TValue> {
        return Promise.reject(
            NotFoundExecutionContextError.create(tokenToString(token)),
        );
    }

    add<TValue>(
        _token: ContextToken<TValue>,
        _value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    put<TValue>(
        _token: ContextToken<TValue>,
        _value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    putIncrement(
        _token: ContextToken<number>,
        _settings?: PutIncrementSettings,
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    putDecrement(
        _token: ContextToken<number>,
        _settings?: PutDecrementSettings,
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    putPush<TValue>(
        _token: ContextToken<Array<TValue>>,
        ..._values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    update<TValue>(
        _token: ContextToken<TValue>,
        _value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    updateIncrement(
        _token: ContextToken<number>,
        _settings?: IncrementSettings,
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    updateDecrement(
        _token: ContextToken<number>,
        _settings?: DecrementSettings,
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    updatePush<TValue>(
        _token: ContextToken<Array<TValue>>,
        ..._values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    remove<TValue>(_token: ContextToken<TValue>): IAsyncContextChain {
        return new AsyncContextChain(this);
    }

    when(
        _condition: AsyncLazyable<boolean>,
        ..._invocables: Array<
            Invocable<[context: IAsyncContext], IAsyncContext>
        >
    ): IAsyncContextChain {
        return new AsyncContextChain(this);
    }
}
