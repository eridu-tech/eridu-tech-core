/**
 * @module FileStorage
 */

import SftpClient from "ssh2-sftp-client";

import type { IResourceFactory } from "@/generic-pool/contracts/_module-exports.js";

/**
 * Connection settings used by `SftpFactory`.
 *
 * Extends `SftpClient.ConnectOptions`, so `host`, `port`, `username`, `password`,
 * `privateKey`, and retry options are forwarded to `client.connect()` unchanged.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export type SftpFactorySettings = {
    /**
     * Label that identifies this client in debug logs.
     */
    name?: string;

    connectionSettings?: SftpClient.ConnectOptions;

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
        const client = new SftpClient(
            this.settings.name,
            this.settings.callbacks,
        );
        await client.connect(this.settings.connectionSettings ?? {});
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
