/**
 * @module Concurrency
 */

import type {
    IConcurrency,
    ITask,
    TaskAllResult,
    TaskInvocable,
    TaskJoinResult,
} from "@/concurrency/contracts/_module-exports.js";
import type { IExecutionContext } from "@/execution-context/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export class Concurrency implements IConcurrency {
    constructor(private readonly executionContext: IExecutionContext) {}

    get signal(): AbortSignal {
        throw new Error("Method not implemented.");
    }

    abort(error: unknown): void {
        throw new Error("Method not implemented.");
    }

    create<TType>(invocable: TaskInvocable<TType>): ITask<TType> {
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

    all<TType extends ReadonlyArray<ITask>>(
        values: TType,
    ): TaskAllResult<TType>;
    all<TType>(iterable: Iterable<ITask<TType>>): ITask<Array<TType>>;
    all<TType>(iterable: Iterable<ITask<TType>>): ITask<Array<TType>> {
        throw new Error("Method not implemented.");
    }

    any<TType extends ReadonlyArray<ITask>>(
        values: TType,
    ): TaskJoinResult<TType>;
    any<TType>(values: Iterable<ITask<TType>>): ITask<TType>;
    any<TType>(iterable: Iterable<ITask<TType>>): ITask<TType> {
        throw new Error("Method not implemented.");
    }

    race<TType extends ReadonlyArray<ITask>>(
        values: TType,
    ): TaskJoinResult<TType>;
    race<TType>(values: Iterable<ITask<TType>>): ITask<TType>;
    race<TType>(iterable: Iterable<ITask<TType>>): ITask<TType> {
        throw new Error("Method not implemented.");
    }
}
