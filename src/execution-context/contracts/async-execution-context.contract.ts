/**
 * @module ExecutionContext
 */

import type {
    ContextToken,
    DecrementSettings,
    IncrementSettings,
    PutDecrementSettings,
    PutIncrementSettings,
} from "@/execution-context/contracts/execution-context.contract.js";
import type {
    AsyncLazyable,
    Invocable,
    Promisable,
} from "@/utilities/_module-exports.js";

/**
 * Read-only contract for asynchronously accessing execution context values.
 *
 * This contract provides methods to retrieve values stored in the execution context.
 * It does not allow modifications, making it suitable for passing as a read-only view
 * of the context to functions that should only inspect values, not modify them.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/contracts"`
 */
export type IAsyncReadableContext = {
    /**
     * Checks if an array context value contains a specific item or matches a predicate.
     *
     * @template TValue - The item type in the array
     * @param token - Token representing an array in the context
     * @param matchValue - Either the exact value to find, or a predicate function to test items
     * @returns true if the array contains the value or matches the predicate, false otherwise
     */
    contains<TValue>(
        token: ContextToken<Array<TValue>>,
        matchValue:
            | NoInfer<TValue>
            | Invocable<[value: NoInfer<TValue>], Promisable<boolean>>,
    ): Promise<boolean>;

    /**
     * Checks if a context value exists (is present in the context).
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to check
     * @returns true if the value exists, false otherwise
     */
    exists<TValue>(token: ContextToken<TValue>): Promise<boolean>;

    /**
     * Checks if a context value is missing (not present in the context).
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to check
     * @returns true if the value is missing, false if it exists
     */
    missing<TValue>(token: ContextToken<TValue>): Promise<boolean>;

    /**
     * Retrieves a context value, or null if not found.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to retrieve
     * @returns The context value, or null if not found
     */
    get<TValue>(token: ContextToken<TValue>): Promise<TValue | null>;

    /**
     * Retrieves a context value with a fallback default value.
     *
     * Returns the stored value if it exists, otherwise returns the provided default.
     * The default value can be a direct value or a lazily-evaluated function.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to retrieve
     * @param defaultValue - The default value to return if not found (can be a function)
     * @returns The context value, or the default value if not found
     */
    getOr<TValue>(
        token: ContextToken<TValue>,
        defaultValue: AsyncLazyable<TValue>,
    ): Promise<TValue>;

    /**
     * Retrieves a context value, throwing an error if not found.
     *
     * Use this when you expect the value to be present and want to fail fast
     * if it's missing.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the value to retrieve
     * @returns The context value
     * @throws {NotFoundExecutionContextError} if the value is not found in the context
     */
    getOrFail<TValue>(token: ContextToken<TValue>): Promise<TValue>;
};

/**
 * Context chain returned by the fluent operations of IAsyncContext.
 *
 * It exposes the full IAsyncContext API for further chaining and is also a `PromiseLike<void>`,
 * so an entire chain of operations can be awaited. Awaiting the chain resolves with `void`.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/contracts"`
 */
export type IAsyncContextChain = IAsyncContext & PromiseLike<void>;

/**
 * Read-write contract for asynchronously managing execution context values.
 *
 * This contract extends IAsyncReadableContext and adds methods for storing, updating,
 * and removing values from the execution context. All mutating methods return
 * IAsyncContextChain to enable method chaining and awaiting.
 * It supports various operations: basic put/update/remove, numeric increment/decrement,
 * array push, and conditional operations.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/contracts"`
 */
export type IAsyncContext = IAsyncReadableContext & {
    /**
     * Adds a value to the context only if it doesn't already exist.
     *
     * If the token already has a value, this operation is a no-op.
     * Useful for initializing context values that should only be set once.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key
     * @param value - The value to add
     * @returns This context instance for method chaining
     */
    add<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain;

    /**
     * Puts a value into the context, creating or overwriting any existing value.
     *
     * This is the primary way to set or update a context value.
     * It always succeeds regardless of whether the key existed before.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key
     * @param value - The value to store
     * @returns This context instance for method chaining
     */
    put<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain;

    /**
     * Puts a numeric value in the context and increments it.
     *
     * If the key doesn't exist, initializes it with the specified initialValue,
     * then increments it. If it exists, increments the current value.
     * Respects the optional max cap.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for initialization and increment behavior
     * @returns This context instance for method chaining
     */
    putIncrement(
        token: ContextToken<number>,
        settings?: PutIncrementSettings,
    ): IAsyncContextChain;

    /**
     * Puts a numeric value in the context and decrements it.
     *
     * If the key doesn't exist, initializes it with the specified initialValue,
     * then decrements it. If it exists, decrements the current value.
     * Respects the optional min floor.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for initialization and decrement behavior
     * @returns This context instance for method chaining
     */
    putDecrement(
        token: ContextToken<number>,
        settings?: PutDecrementSettings,
    ): IAsyncContextChain;

    /**
     * Puts an array into the context and pushes values to it.
     *
     * If the key doesn't exist, creates a new array with the provided values.
     * If it exists, appends the provided values to the existing array.
     * Enables accumulating arrays in the context.
     *
     * @template TValue - The item type in the array
     * @param token - Token representing an array in the context
     * @param values - The values to push to the array
     * @returns This context instance for method chaining
     */
    putPush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain;

    /**
     * Updates an existing context value only if it already exists.
     *
     * If the token doesn't have a value, this operation is a no-op.
     * Useful for safely updating values that should already be present.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key
     * @param value - The new value
     * @returns This context instance for method chaining
     */
    update<TValue>(
        token: ContextToken<TValue>,
        value: NoInfer<TValue>,
    ): IAsyncContextChain;

    /**
     * Updates an existing numeric value in the context by incrementing it.
     *
     * Only increments if the value already exists.
     * Respects the optional max cap.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for increment behavior
     * @returns This context instance for method chaining
     */
    updateIncrement(
        token: ContextToken<number>,
        settings?: IncrementSettings,
    ): IAsyncContextChain;

    /**
     * Updates an existing numeric value in the context by decrementing it.
     *
     * Only decrements if the value already exists.
     * Respects the optional min floor.
     *
     * @param token - Token representing a numeric value in the context
     * @param settings - Configuration for decrement behavior
     * @returns This context instance for method chaining
     */
    updateDecrement(
        token: ContextToken<number>,
        settings?: DecrementSettings,
    ): IAsyncContextChain;

    /**
     * Updates an existing array in the context by pushing values to it.
     *
     * Only appends to the array if it already exists.
     * If the value doesn't exist, this operation is a no-op.
     *
     * @template TValue - The item type in the array
     * @param token - Token representing an array in the context
     * @param values - The values to push to the array
     * @returns This context instance for method chaining
     */
    updatePush<TValue>(
        token: ContextToken<Array<TValue>>,
        ...values: Array<NoInfer<TValue>>
    ): IAsyncContextChain;

    /**
     * Removes a value from the context.
     *
     * After removal, the token will be missing from the context.
     * Subsequent get() calls will return null.
     *
     * @template TValue - The type of the value
     * @param token - Token representing the context key to remove
     * @returns This context instance for method chaining
     */
    remove<TValue>(token: ContextToken<TValue>): IAsyncContextChain;

    /**
     * Conditionally applies one or more operations to the context.
     *
     * If the condition evaluates to true, executes all provided invocable functions
     * with this context. The condition can be a direct boolean or a lazy-evaluated function.
     * Useful for conditional context modifications.
     *
     * @param condition - Boolean condition or function that returns a condition
     * @param invocables - Functions to execute if condition is true, each receives this context
     * @returns This context instance for method chaining
     */
    when(
        condition: AsyncLazyable<boolean>,
        ...invocables: Array<Invocable<[context: IAsyncContext], IAsyncContext>>
    ): IAsyncContextChain;
};

/**
 * Base contract for asynchronous execution context operations.
 *
 * Provides methods for executing code within an execution context,
 * ensuring context values are accessible during execution, and awaiting
 * the result of the executed function.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/contracts"`
 */
export type IAsyncExecutionContextBase = {
    /**
     * Executes a function within this execution context.
     *
     * The function runs with this context active, making all stored context values
     * accessible to the function and any functions it calls.
     *
     * @template TValue - The return type of the function
     * @param invocable - The function to execute within this context
     * @returns The return value of the executed function
     */
    run<TValue>(invocable: Invocable<[], Promisable<TValue>>): Promise<TValue>;
};

/**
 * Complete asynchronous execution context contract combining execution capabilities with context management.
 *
 * Combines IAsyncExecutionContextBase (for running code with context) and IAsyncContext
 * (for reading and writing values).
 * This is the primary contract for working with execution contexts in asynchronous scenarios.
 * It allows you to manage context values and execute code within that context.
 *
 * IMPORT_PATH: `"eridu-tech/execution-context/contracts"`
 */
export type IAsyncExecutionContext = IAsyncExecutionContextBase & IAsyncContext;

/**
 * @internal
 *
 * Internal contract for copyable asynchronous execution contexts.
 *
 * Extends IAsyncContext with the ability to create copies of the context.
 * Used internally by async execution context implementations. Not intended for public use.
 */
export type IAsyncCopyableContext = IAsyncContext & {
    /**
     * Creates a copy of this context.
     *
     * The copy contains the same key-value mappings but is a separate object.
     * Modifications to the copy don't affect the original context.
     *
     * @returns A new context containing the same values as this context
     * @internal
     */
    copy(): IAsyncCopyableContext;
};
