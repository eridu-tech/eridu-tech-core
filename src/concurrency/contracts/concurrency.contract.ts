/**
 * @module Concurrency
 */

import { AbortConcurrencyError } from "@/concurrency/contracts/concurrency.errors.js";

import type {
    IInvocableObject,
    InvocableFn,
} from "@/utilities/_module-exports.js";

/**
 * Work described by an object with an `invoke` method.
 * The active `AbortSignal` propagates implicitly through the task context.
 *
 * @template TValue - The value the task resolves to.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type ITaskInvocableObject<TValue = unknown> = IInvocableObject<
    [],
    Promise<TValue>
>;

/**
 * Work described by a plain function.
 * The active `AbortSignal` propagates implicitly through the task context.
 *
 * @template TValue - The value the task resolves to.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type TaskInvocableFn<TValue = unknown> = InvocableFn<
    [],
    Promise<TValue>
>;

/**
 * Async work that can be turned into a task: a function or an object with `invoke`.
 * It takes no arguments; the active `AbortSignal` propagates implicitly.
 *
 * @throws {AbortConcurrencyError} When aborted
 *
 * @template TValue - The value the task resolves to.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type TaskInvocable<TValue = unknown> =
    ITaskInvocableObject<TValue> | TaskInvocableFn<TValue>;

/**
 * An abortable async unit of work.
 * Its `AbortSignal` propagates implicitly through the task context.
 *
 * @template TValue - The value the task resolves to.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type ITask<TValue = unknown> = ITaskInvocableObject<TValue> & {
    /**
     * `true` once the task has been aborted.
     */
    readonly isAborted: boolean;

    /**
     * Aborts the task and propagates the abort through its task context.
     *
     * @param error - The reason reported through the `AbortSignal`.
     * @returns `true` if this call aborted the task, `false` if it was already aborted or finished.
     */
    abort(error?: unknown): boolean;

    /**
     * Starts the task without waiting for it to complete.
     * Its active `AbortSignal` propagates implicitly through the task context.
     */
    runInBackground(): void;

    /**
     * Detaches the task from its parent so it is no longer aborted or awaited by it.
     */
    detach(): void;
};

/**
 * The value a task resolves to.
 *
 * @template TTask - The task type to infer from.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type PInferTaskReturn<TTask extends ITask = ITask> = Awaited<
    ReturnType<TTask["invoke"]>
>;

/**
 * Result of `all` on a tuple of tasks: a task resolving to each task's result
 * in the same order as the input tasks.
 *
 * @template TType - The tuple of tasks that were awaited.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type TaskAllResult<
    TType extends ReadonlyArray<ITask> = ReadonlyArray<ITask>,
> = ITask<{
    -readonly [P in keyof TType]: PInferTaskReturn<TType[P]>;
}>;

/**
 * Result of `any` or `race` on a tuple of tasks: a task resolving to one
 * of the competing tasks' results.
 *
 * @template TType - The tuple of tasks that competed.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type TaskJoinResult<
    TType extends ReadonlyArray<ITask> = ReadonlyArray<ITask>,
> = ITask<PInferTaskReturn<TType[number]>>;

/**
 * Combinators that run several tasks as one.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type ITaskGroup = {
    /**
     * Waits for every task to succeed and resolves with their results,
     * in the same order as the input tasks.
     *
     * @param values - The tasks to wait for.
     * @returns A task resolving to a tuple of each task's result.
     */
    all<TType extends ReadonlyArray<ITask>>(
        values: TType,
    ): TaskAllResult<TType>;

    /**
     * Same as the tuple overload, for any iterable of tasks.
     *
     * @param iterable - The tasks to wait for.
     * @returns A task resolving to an array of each task's result.
     */
    all<TType>(iterable: Iterable<ITask<TType>>): ITask<Array<TType>>;

    /**
     * Resolves with the result of the first task that succeeds.
     * Rejects only when every task fails.
     *
     * @param values - The tasks to compete.
     */
    any<TType extends ReadonlyArray<ITask>>(
        values: TType,
    ): TaskJoinResult<TType>;

    /**
     * Same as the tuple overload, for any iterable of tasks.
     *
     * @param values - The tasks to compete.
     */
    any<TType>(values: Iterable<ITask<TType>>): ITask<TType>;

    /**
     * Settles with the first task to settle, whether it succeeds or fails.
     *
     * @param values - The tasks to race.
     */
    race<TType extends ReadonlyArray<ITask>>(
        values: TType,
    ): TaskJoinResult<TType>;

    /**
     * Same as the tuple overload, for any iterable of tasks.
     *
     * @param values - The tasks to race.
     */
    race<TType>(values: Iterable<ITask<TType>>): ITask<TType>;
};

/**
 * Helpers for creating async tasks and accessing or aborting the current task context.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type ITaskHelpers = {
    /**
     * The `AbortSignal` active in the current task context.
     */
    readonly signal: AbortSignal;

    /**
     * Aborts the current task context and propagates the reason to its tasks.
     *
     * @param error - The reason reported through the `AbortSignal`.
     */
    abort(error: unknown): void;

    /**
     * Wraps work in an abortable task. The active `AbortSignal` propagates
     * implicitly; the work takes no arguments.
     *
     * @param invocable - The work to wrap.
     */
    create<TType>(invocable: TaskInvocable<TType>): ITask<TType>;

    /**
     * Creates a task that already succeeded with `undefined`.
     */
    resolve(): ITask<void>;

    /**
     * Creates a task that already succeeded with `value`.
     *
     * @param value - The value the task resolves to.
     */
    resolve<TType>(value: TType): ITask<TType>;

    /**
     * Creates a task that already failed with `error`.
     *
     * @param error - The reason the task rejects with.
     */
    reject<TType>(error: unknown): ITask<TType>;
};

/**
 * Async concurrency contract combining task helpers and task combinators.
 * Tasks inherit the active `AbortSignal` implicitly.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Contracts
 */
export type IConcurrency = ITaskHelpers & ITaskGroup;
