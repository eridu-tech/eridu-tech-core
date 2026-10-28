/**
 * @module FileStorage
 */

import SftpClient from "ssh2-sftp-client";

import type { IResourceFactory } from "@/generic-pool/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export type SftpFactorySettings = SftpClient.ConnectOptions & {
    name?: string;
    callbacks?: SftpClient.Callbacks;
};

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export class SftpFactory implements IResourceFactory<SftpClient> {
    constructor(private readonly settings: SftpFactorySettings) {}

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
