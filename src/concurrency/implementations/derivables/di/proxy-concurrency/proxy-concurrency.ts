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
import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";

/**
 * Settings used to construct a {@link ProxyConcurrency}.
 *
 * `container` is the resolver the concurrency is looked up in, and
 * `resolverToken` is the {@link DiToken} it is registered under.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/di"`
 * @group Derivables
 */
export type ProxyConcurrencySettings = {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<IConcurrency>;
};

/**
 * An {@link IConcurrency} that resolves the underlying concurrency from a
 * dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyConcurrencySettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link IConcurrency}. Resolution happens lazily, so the binding can use
 * any `LIFETIME`:
 *
 * - `SINGLETON` registrations can be used once `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * A `TRANSIENT` registration resolves a new instance on every access, including each
 * `signal` read and `abort()` call, so prefer `SINGLETON` or `SCOPED`.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/di"`
 * @group Derivables
 */
export class ProxyConcurrency implements IConcurrency {
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<IConcurrency>;

    constructor(settings: ProxyConcurrencySettings) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    get signal(): AbortSignal {
        return this.container.resolveOrFail(this.resolverToken).signal;
    }

    abort(error: unknown): void {
        this.container.resolveOrFail(this.resolverToken).abort(error);
    }

    create<TType>(
        invocable: TaskInvocable<TType>,
        settings?: TaskSettings,
    ): ITask<TType> {
        return this.container
            .resolveOrFail(this.resolverToken)
            .create(invocable, settings);
    }

    resolve(): ITask<void>;
    resolve<TType>(value: TType): ITask<TType>;
    resolve<TType>(value?: TType): ITask<void | TType> {
        return this.container.resolveOrFail(this.resolverToken).resolve(value);
    }

    reject<TType>(error: unknown): ITask<TType> {
        return this.container.resolveOrFail(this.resolverToken).reject(error);
    }

    timeout(time: ITimeSpan): ITask<void> {
        return this.container.resolveOrFail(this.resolverToken).timeout(time);
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
        settings?: TaskSettings,
    ): ITask<Array<PromiseSettledResult<TType>>> {
        return this.container
            .resolveOrFail(this.resolverToken)
            .allSettled(iterable, settings);
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
        settings?: TaskSettings,
    ): ITask<Array<TType>> {
        return this.container
            .resolveOrFail(this.resolverToken)
            .all(iterable, settings);
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
        settings?: TaskSettings,
    ): ITask<TType> {
        return this.container
            .resolveOrFail(this.resolverToken)
            .any(iterable, settings);
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
        settings?: TaskSettings,
    ): ITask<TType> {
        return this.container
            .resolveOrFail(this.resolverToken)
            .race(iterable, settings);
    }
}
