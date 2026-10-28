/**
 * @module FileStorage
 */

import SftpClient from "ssh2-sftp-client";

import { QueuePool } from "@/generic-pool/implementations/_module-exports.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    IGenericPool,
    IResourceFactory,
} from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Connection settings used by `SftpFactory`.
 *
 * Extends `SftpClient.ConnectOptions`, so `host`, `port`, `username`, `password`,
 * `privateKey`, and retry options are forwarded to `client.connect()` unchanged.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export type SftpFactorySettings = SftpClient.ConnectOptions & {
    /**
     * Label that identifies this client in debug logs.
     */
    name?: string;

    /**
     * Client lifecycle listeners, invoked on `error`, `end`, and `close`.
     */
    callbacks?: SftpClient.Callbacks;
};

/**
 * Resource factory that manages SFTP client connections.
 *
 * `create` opens and connects a new client, `validate` reports whether an existing
 * client still responds, and `destroy` ends the connection.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export class SftpFactory implements IResourceFactory<SftpClient> {
    constructor(private readonly settings: SftpFactorySettings = {}) {}

    async create(): Promise<SftpClient> {
        const { name, callbacks, ...connectOptions } = this.settings;
        const client = new SftpClient(name, callbacks);
        await client.connect(connectOptions);
        return client;
    }

    async destroy(resource: SftpClient): Promise<void> {
        await resource.end();
    }

    async validate(resource: SftpClient): Promise<boolean> {
        try {
            await resource.cwd();
            return true;
        } catch {
            return false;
        }
    }
}

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
