/**
 * @module ExecutionContext
 */

import { NotFoundExecutionContextError } from "@/execution-context/contracts/execution-context.errors.js";
import {
    AsyncContextChain,
    tokenToString,
} from "@/execution-context/implementations/derivables/async-execution-context/_shared.js";
import {
    callInvocable,
    isInvocable,
    OPTION,
    optionNone,
    optionSome,
    resolveAsyncLazyable,
} from "@/utilities/_module-exports.js";

import type { DiToken } from "@/di/contracts/_module-exports.js";
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
    Option,
    Promisable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class AsyncContext implements IAsyncCopyableContext {
    constructor(private readonly map: Map<DiToken, unknown>) {}

    copy(): IAsyncCopyableContext {
        return new AsyncContext(
            new Map(
                [...this.map].map<[DiToken, unknown]>(([key, value]) => {
                    if (Array.isArray(value)) {
                        return [key, [...(value as Array<unknown>)]];
                    }
                    return [key, value];
                }),
            ),
        );
    }

    async contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invocable<[value: NoInfer<TValue>], Promisable<boolean>>,
    ): Promise<boolean> {
        const arr = this.getValue_(token);
        if (arr === null) {
            return false;
        }
        let predicate: Invocable<[value: NoInfer<TValue>], Promisable<boolean>>;
        if (!isInvocable(matchValue)) {
            const value = matchValue;
            predicate = (item_) => item_ === value;
        } else {
            predicate = matchValue;
        }
        for (const item of arr) {
            if (await callInvocable(predicate, item)) {
                return true;
            }
        }
        return false;
    }

    exists<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return Promise.resolve(this.map.has(token));
    }

    missing<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return Promise.resolve(!this.map.has(token));
    }

    private get_<TValue>(token: ContextToken<TValue>): Option<TValue> {
        if (!this.map.has(token)) {
            return optionNone();
        }
        return optionSome(this.map.get(token) as TValue);
    }

    private getValue_<TValue>(token: ContextToken<TValue>): TValue | null {
        const item = this.get_(token);
        if (item.type === OPTION.NONE) {
            return null;
        }
        return item.value;
    }

    get<TValue>(token: ContextToken<TValue>): Promise<TValue | null> {
        return Promise.resolve(this.getValue_(token));
    }

    async getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: AsyncLazyable<TValue>,
    ): Promise<TValue> {
        const item = this.get_(token);
        if (item.type === OPTION.NONE) {
            return await resolveAsyncLazyable(defaultValue);
        }
        return item.value;
    }

    getOrFail<TValue>(token: ContextToken<TValue>): Promise<TValue> {
        const item = this.get_(token);
        if (item.type === OPTION.NONE) {
            return Promise.reject(
                NotFoundExecutionContextError.create(tokenToString(token)),
            );
        }
        return Promise.resolve(item.value);
    }

    add<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        if (!this.map.has(token)) {
            this.map.set(token, value);
        }
        return new AsyncContextChain(this);
    }

    put<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        this.map.set(token, value);
        return new AsyncContextChain(this);
    }

    putIncrement(
        token: ContextToken<number>,
        settings: PutIncrementSettings = {},
    ): IAsyncContextChain {
        const { nbr = 1, max = null, initialValue = 0 } = settings;
        const value = this.getValue_(token);
        if (value === null) {
            return this.add(
                token,
                max === null ? initialValue : Math.min(initialValue, max),
            );
        }
        const newValue = value + nbr;
        return this.update(
            token,
            max === null ? newValue : Math.min(newValue, max),
        );
    }

    putDecrement(
        token: ContextToken<number>,
        settings: PutDecrementSettings = {},
    ): IAsyncContextChain {
        const { nbr = 1, min = null, initialValue = 0 } = settings;
        const value = this.getValue_(token);
        if (value === null) {
            return this.add(
                token,
                min === null ? initialValue : Math.max(initialValue, min),
            );
        }
        const newValue = value - nbr;
        return this.update(
            token,
            min === null ? newValue : Math.max(newValue, min),
        );
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        const prevArr = this.getValue_(token);
        if (prevArr === null) {
            return this.add(token, values);
        }
        return this.update(token, [...prevArr, ...values]);
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        if (this.map.has(token)) {
            this.map.set(token, value);
        }
        return new AsyncContextChain(this);
    }

    updateIncrement(
        token: ContextToken<number>,
        settings: IncrementSettings = {},
    ): IAsyncContextChain {
        const { nbr = 1, max = null } = settings;
        const value = this.getValue_(token);
        if (value === null) {
            return new AsyncContextChain(this);
        }
        const newValue = value + nbr;
        return this.update(
            token,
            max === null ? newValue : Math.min(newValue, max),
        );
    }

    updateDecrement(
        token: ContextToken<number>,
        settings: DecrementSettings = {},
    ): IAsyncContextChain {
        const { nbr = 1, min = null } = settings;
        const value = this.getValue_(token);
        if (value === null) {
            return new AsyncContextChain(this);
        }
        const newValue = value - nbr;
        return this.update(
            token,
            min === null ? newValue : Math.max(newValue, min),
        );
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        const prevArr = this.getValue_(token);
        if (prevArr === null) {
            return new AsyncContextChain(this);
        }
        return this.update(token, [...prevArr, ...values]);
    }

    remove<TValue>(token: ContextToken<TValue>): IAsyncContextChain {
        this.map.delete(token);
        return new AsyncContextChain(this);
    }

    when(
        condition: AsyncLazyable<boolean>,
        ...invocables: Array<Invocable<[context: IAsyncContext], IAsyncContext>>
    ): IAsyncContextChain {
        if (!isInvocable(condition)) {
            if (condition) {
                for (const invocable of invocables) {
                    callInvocable(invocable, this);
                }
            }
            return new AsyncContextChain(this);
        }
        return new AsyncContextChain(
            this,
            Promise.resolve(callInvocable(condition)).then(async (result) => {
                if (!result) {
                    return;
                }
                for (const invocable of invocables) {
                    await Promise.resolve(callInvocable(invocable, this));
                }
            }),
        );
    }
}
