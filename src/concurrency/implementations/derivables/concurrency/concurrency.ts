/**
 * @module Concurrency
 */

import type {
    TaskSettings,
    IConcurrency,
    ITask,
    TaskAllResult,
    TaskInvocable,
    TaskJoinResult,
} from "@/concurrency/contracts/_module-exports.js";
import type { IExecutionContext } from "@/execution-context/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";

/**
 * Default {@link IConcurrency} implementation that reads the active task context
 * from an {@link IExecutionContext}.
 *
 * Tasks made by `create()`, `resolve()`, `reject()` and `timeout()` capture the task
 * context that is active when they are created, so aborting the surrounding task also
 * aborts them. The combinators (`allSettled`, `all`, `any`, `race`) group the given
 * tasks into a single abortable task, and their `settings` apply to that grouped task.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency"`
 * @group Derivables
 */
export class Concurrency implements IConcurrency {
    /**
     * @param executionContext - The execution context that carries the active task
     * context, and with it the `AbortSignal` inherited by created tasks.
     */
    constructor(private readonly executionContext: IExecutionContext) {}

    get signal(): AbortSignal {
        throw new Error("Method not implemented.");
    }

    abort(error: unknown): void {
        throw new Error("Method not implemented.");
    }

    create<TType>(
        invocable: TaskInvocable<TType>,
        settings: TaskSettings = {},
    ): ITask<TType> {
        const { timeout = null, signal = new AbortController().signal } =
            settings;
        throw new Error("Method not implemented.");
    }

    resolve(): ITask<void>;
    resolve<TType>(value: TType): ITask<TType>;
    resolve<TType>(value?: TType): ITask<void | TType> {
        throw new Error("Method not implemented.");
    }

    reject<TType>(error: unknown): ITask<TType> {
        throw new Error("Method not implemented.");
    }

    timeout(time: ITimeSpan): ITask<void> {
        throw new Error("Method not implemented.");
    }

    allSettled<
        TType extends ReadonlyArray<ITask<PromiseSettledResult<unknown>>>,
    >(values: TType, settings?: TaskSettings): TaskAllResult<TType>;
    allSettled<TType>(
        iterable: Iterable<ITask<TType>>,
        settings?: TaskSettings,
    ): ITask<Array<PromiseSettledResult<TType>>>;
    allSettled<TType>(
        iterable: Iterable<ITask<TType>>,
        settings: TaskSettings = {},
    ): ITask<Array<PromiseSettledResult<TType>>> {
        const { timeout = null, signal = new AbortController().signal } =
            settings;
        throw new Error("Method not implemented.");
    }

    all<TType extends ReadonlyArray<ITask>>(
        values: TType,
        settings?: TaskSettings,
    ): TaskAllResult<TType>;
    all<TType>(
        iterable: Iterable<ITask<TType>>,
        settings?: TaskSettings,
    ): ITask<Array<TType>>;
    all<TType>(
        iterable: Iterable<ITask<TType>>,
        settings: TaskSettings = {},
    ): ITask<Array<TType>> {
        const { timeout = null, signal = new AbortController().signal } =
            settings;
        throw new Error("Method not implemented.");
    }

    any<TType extends ReadonlyArray<ITask>>(
        values: TType,
        settings?: TaskSettings,
    ): TaskJoinResult<TType>;
    any<TType>(
        values: Iterable<ITask<TType>>,
        settings?: TaskSettings,
    ): ITask<TType>;
    any<TType>(
        iterable: Iterable<ITask<TType>>,
        settings: TaskSettings = {},
    ): ITask<TType> {
        const { timeout = null, signal = new AbortController().signal } =
            settings;
        throw new Error("Method not implemented.");
    }

    race<TType extends ReadonlyArray<ITask>>(
        values: TType,
        settings?: TaskSettings,
    ): TaskJoinResult<TType>;
    race<TType>(
        values: Iterable<ITask<TType>>,
        settings?: TaskSettings,
    ): ITask<TType>;
    race<TType>(
        iterable: Iterable<ITask<TType>>,
        settings: TaskSettings = {},
    ): ITask<TType> {
        const { timeout = null, signal = new AbortController().signal } =
            settings;
        throw new Error("Method not implemented.");
    }
}
