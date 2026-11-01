/**
 * @module FileStorage
 */

import { FtpFactory } from "@/file-storage/implementations/adapters/ftp-file-storage-adapter/ftp-factory.js";
import { QueuePool } from "@/generic-pool/implementations/_module-exports.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type { Client } from "basic-ftp";

import type { FtpFactorySettings } from "@/file-storage/implementations/adapters/ftp-file-storage-adapter/ftp-factory.js";
import type {
    IGenericPool,
    IResourceFactory,
} from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Settings for `ftpPool`.
 *
 * Combines the connection settings of `FtpFactorySettings` with an optional
 * `poolFactory` that controls how clients are pooled.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/ftp-file-storage-adapter"`
 * @group Adapters
 */
export type FtpPoolSettings = FtpFactorySettings & {
    /**
     * Builds the pool that holds the FTP clients.
     *
     * @default
     * ```ts
     * import { QueuePool } from "eridu-tech/generic-pool";
     *
     * (resourceFactory) => new QueuePool(resourceFactory)
     * ```
     */
    poolFactory?: Invocable<
        [resourceFactory: IResourceFactory<Client>],
        IGenericPool<Client>
    >;
};

/**
 * Creates a pool of FTP clients that all share the given connection settings.
 *
 * @param settings - Connection settings plus an optional `poolFactory`.
 * @returns A pool of connected `Client` instances.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/ftp-file-storage-adapter"`
 * @group Adapters
 */
export function ftpPool(settings: FtpPoolSettings): IGenericPool<Client> {
    const {
        poolFactory = (resourceFactory) => new QueuePool(resourceFactory),
        ...rest
    } = settings;
    return callInvocable(poolFactory, new FtpFactory(rest));
}
