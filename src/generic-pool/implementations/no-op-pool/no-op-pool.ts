/**
 * @module GenericPool
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { IGenericPool } from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * Settings for a pool that always returns the same client.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool"`
 * @group Implementations
 */
export type NoOpPoolSettings<TClient = unknown> = {
    client: TClient;

    /**
     * Destroys a resource.
     */
    destroy(resource: TClient): Promisable<void>;
};

/**
 * A pool that gives every caller the same client and ignores releases.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool"`
 * @group Implementations
 */
export class NoOpPool<TClient> implements IGenericPool<TClient> {
    constructor(private readonly settings: NoOpPoolSettings<TClient>) {}

    acquireOrFail(): Promise<TClient> {
        return Promise.resolve(this.settings.client);
    }

    release(_client: TClient): Promise<void> {
        return Promise.resolve();
    }

    async run<TReturn>(
        fn: Invocable<[client: TClient], Promisable<TReturn>>,
    ): Promise<TReturn> {
        return callInvocable(fn, this.settings.client);
    }

    async close(): Promise<void> {
        return this.settings.destroy(this.settings.client);
    }
}
