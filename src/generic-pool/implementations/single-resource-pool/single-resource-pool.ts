/**
 * @module GenericPool
 */

import { QueuePool } from "@/generic-pool/implementations/queue-pool/_module.js";

import type {
    IGenericPool,
    IResourceFactory,
} from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * Settings for a pool that provides one client at a time.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool"`
 * @group Implementations
 */
export type SinglePoolSettings<TClient = unknown> = {
    client: TClient;

    /**
     * Destroys a resource.
     */
    destroy(resource: TClient): Promisable<void>;

    /**
     * Maximum number of callers that can wait for a resource. Use `null` for no limit.
     * @default null
     */
    maxWaitSize?: number | null;
};

/**
 * @internal
 */
class NoOpResourceFactory<TClient> implements IResourceFactory<TClient> {
    constructor(private readonly settings: SinglePoolSettings<TClient>) {}

    create(): Promisable<TClient> {
        return this.settings.client;
    }

    destroy(resource: TClient): Promisable<void> {
        return this.settings.destroy(resource);
    }
}

/**
 * A pool that lets one caller use the client at a time.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool"`
 * @group Implementations
 */
export class SingleResourcePool<TClient> implements IGenericPool<TClient> {
    private readonly pool: IGenericPool<TClient>;

    constructor(settings: SinglePoolSettings<TClient>) {
        this.pool = new QueuePool(new NoOpResourceFactory(settings), {
            maxResources: 1,
            maxWaitSize: settings.maxWaitSize,
        });
    }

    acquireOrFail(): Promise<TClient> {
        return this.pool.acquireOrFail();
    }

    release(client: TClient): Promise<void> {
        return this.pool.release(client);
    }

    run<TReturn>(
        fn: Invocable<[client: TClient], Promisable<TReturn>>,
    ): Promise<TReturn> {
        return this.pool.run(fn);
    }

    close(): Promise<void> {
        return this.pool.close();
    }
}
