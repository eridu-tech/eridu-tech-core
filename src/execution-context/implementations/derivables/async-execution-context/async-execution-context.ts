/**
 * @module ExecutionContext
 */

import { AsyncContext } from "@/execution-context/implementations/derivables/async-execution-context/async-context.js";
import { NoOpAsyncContext } from "@/execution-context/implementations/derivables/async-execution-context/no-op-async-context.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    ContextToken,
    DecrementSettings,
    IAsyncContext,
    IAsyncContextChain,
    IAsyncCopyableContext,
    IAsyncExecutionContext,
    IExecutionContextAdapter,
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
 * IMPORT_PATH: `"eridu-tech/execution-context"`
 *
 * Asynchronously manages execution context values and provides a way to execute functions within a context.
 *
 * The AsyncExecutionContext class serves as the main entry point for asynchronous context management.
 * It delegates all operations to an underlying context adapter that handles the actual
 * storage and lifecycle of context values. This allows different adapter implementations
 * (e.g., AsyncLocalStorage for Node.js) to manage context differently.
 *
 * Provides methods to:
 * - Get, set, update, and remove context values using context tokens
 * - Execute async functions within a specific context
 *
 * @group Derivables
 */
export class AsyncExecutionContext implements IAsyncExecutionContext {
    /**
     * Creates a new AsyncExecutionContext instance.
     *
     * @param executionContextStorage - The adapter responsible for storing and managing context values
     */
    constructor(
        private readonly executionContextStorage: IExecutionContextAdapter<IAsyncCopyableContext>,
    ) {}

    private get current(): IAsyncCopyableContext {
        const context = this.executionContextStorage.get();
        if (context === null) {
            return new NoOpAsyncContext();
        }
        return context;
    }

    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invocable<[value: NoInfer<TValue>], Promisable<boolean>>,
    ): Promise<boolean> {
        return this.current.contains(token, matchValue);
    }

    exists<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return this.current.exists(token);
    }

    missing<TValue>(token: ContextToken<TValue>): Promise<boolean> {
        return this.current.missing(token);
    }

    get<TValue>(token: ContextToken<TValue>): Promise<TValue | null> {
        return this.current.get(token);
    }

    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: AsyncLazyable<TValue>,
    ): Promise<TValue> {
        return this.current.getOr(token, defaultValue);
    }

    getOrFail<TValue>(token: ContextToken<TValue>): Promise<TValue> {
        return this.current.getOrFail(token);
    }

    add<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.current.add(token, value);
    }

    put<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.current.put(token, value);
    }

    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IAsyncContextChain {
        return this.current.putIncrement(token, settings);
    }

    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IAsyncContextChain {
        return this.current.putDecrement(token, settings);
    }

    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.current.putPush(token, ...values);
    }

    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain {
        return this.current.update(token, value);
    }

    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IAsyncContextChain {
        return this.current.updateIncrement(token, settings);
    }

    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IAsyncContextChain {
        return this.current.updateDecrement(token, settings);
    }

    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain {
        return this.current.updatePush(token, ...values);
    }

    remove<TValue>(token: ContextToken<TValue>): IAsyncContextChain {
        return this.current.remove(token);
    }

    when(
        condition: AsyncLazyable<boolean>,
        ...invocables: Array<Invocable<[context: IAsyncContext], IAsyncContext>>
    ): IAsyncContextChain {
        return this.current.when(condition, ...invocables);
    }

    async run<TValue>(
        invocable: Invocable<[], Promisable<TValue>>,
    ): Promise<TValue> {
        const currentContext = this.executionContextStorage.get();
        const contextToRun =
            currentContext === null
                ? new AsyncContext(new Map())
                : currentContext.copy();
        return await this.executionContextStorage.run(
            contextToRun,
            async () => {
                return await callInvocable(invocable);
            },
        );
    }
}
