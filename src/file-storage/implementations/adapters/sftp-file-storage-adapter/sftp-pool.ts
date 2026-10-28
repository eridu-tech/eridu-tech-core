/**
 * @module FileStorage
 */

import { SftpFactory } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/sftp-factory.js";
import { QueuePool } from "@/generic-pool/implementations/_module-exports.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type SftpClient from "ssh2-sftp-client";

import type { SftpFactorySettings } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/sftp-factory.js";
import type {
    IGenericPool,
    IResourceFactory,
} from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Settings for `sftpPool`.
 *
 * Combines the connection settings of `SftpFactorySettings` with an optional
 * `poolFactory` that controls how clients are pooled.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export type SftpPoolSettings = SftpFactorySettings & {
    /**
     * Builds the pool that holds the SFTP clients.
     *
     * @default
     * ```ts
     * import { QueuePool } from "eridu-tech/generic-pool";
     *
     * (resourceFactory) => new QueuePool(resourceFactory)
     * ```
     */
    poolFactory?: Invocable<
        [resourceFactory: IResourceFactory<SftpClient>],
        IGenericPool<SftpClient>
    >;
};

/**
 * Creates a pool of SFTP clients that all share the given connection settings.
 *
 * @param settings - Connection settings plus an optional `poolFactory`.
 * @returns A pool of connected `SftpClient` instances.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export function sftpPool(settings: SftpPoolSettings): IGenericPool<SftpClient> {
    const {
        poolFactory = (resourceFactory) => new QueuePool(resourceFactory),
        ...rest
    } = settings;
    return callInvocable(poolFactory, new SftpFactory(rest));
}
