/**
 * @module Semaphore
 */

import { v4 } from "uuid";

import { ProxySemaphoreFactory } from "@/semaphore/implementations/derivables/di/proxy-semaphore-factory-resolver/proxy-semaphore-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ISemaphore,
    ISemaphoreFactory,
    ISemaphoreFactoryResolver,
    SemaphoreFactoryCreateSettings,
} from "@/semaphore/contracts/_module-exports.js";
import type { SemaphoreFactorySettingsBase } from "@/semaphore/implementations/derivables/_module-exports.js";

/**
 * Settings used to construct a {@link ProxySemaphoreFactoryResolver}.
 *
 * The optional `defaultTtl` and `createSlotId` settings mirror
 * {@link SemaphoreFactorySettingsBase} and fall back to the same defaults as
 * {@link SemaphoreFactory} when omitted.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/di"`
 * @group Derivables
 */
export type ProxySemaphoreFactoryResolverSettings<
    TAdapters extends string = string,
> = Pick<SemaphoreFactorySettingsBase, "defaultTtl" | "createSlotId"> & {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<ISemaphoreFactoryResolver<TAdapters>>;
};

/**
 * An {@link ISemaphoreFactoryResolver} and {@link ISemaphoreFactory} that resolve the
 * underlying resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxySemaphoreFactoryResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link ISemaphoreFactoryResolver}. Because resolution happens lazily, every
 * `LIFETIME` is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link ISemaphoreFactory} whose semaphores resolve the
 * resolver when one of their operations is invoked.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/di"`
 * @group Derivables
 */
export class ProxySemaphoreFactoryResolver<TAdapters extends string = string>
    implements ISemaphoreFactoryResolver<TAdapters>, ISemaphoreFactory
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<
        ISemaphoreFactoryResolver<TAdapters>
    >;
    private readonly settings: Required<
        Pick<SemaphoreFactorySettingsBase, "defaultTtl" | "createSlotId">
    >;

    constructor(settings: ProxySemaphoreFactoryResolverSettings) {
        const {
            container,
            resolverToken,
            createSlotId = () => v4(),
            defaultTtl = TimeSpan.fromMinutes(5),
        } = settings;

        this.container = container;
        this.resolverToken = resolverToken;
        this.settings = {
            createSlotId,
            defaultTtl,
        };
    }

    use(adapterName?: TAdapters): ISemaphoreFactory {
        return new ProxySemaphoreFactory(
            this.container,
            this.resolverToken,
            adapterName,
            this.settings,
        );
    }

    create(key: string, settings: SemaphoreFactoryCreateSettings): ISemaphore {
        return this.use().create(key, settings);
    }
}
