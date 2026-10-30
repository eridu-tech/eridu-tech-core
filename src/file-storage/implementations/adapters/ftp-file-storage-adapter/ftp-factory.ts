/**
 * @module FileStorage
 */

import { Client } from "basic-ftp";

import { callInvocable } from "@/utilities/_module-exports.js";

import type { AccessOptions, ClientOptions } from "basic-ftp";
import type { Promisable } from "type-fest";

import type { IResourceFactory } from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/ftp-file-storage-adapter"`
 * @group Adapters
 */
export type FtpFactorySettingsBase = {
    /**
     * Client-level options: `allowSeparateTransferHost` and `maxListingBytes`.
     */
    clientSettings?: Partial<ClientOptions>;

    /**
     * How the connection is opened and logged in: `host`, `port`, `user`,
     * `password`, `secure`, and `secureOptions`.
     */
    accessSettings?: AccessOptions;

    /**
     * Socket timeout in milliseconds. Use `0` for no timeout.
     *
     * @default 30000
     */
    timeout?: number;
};

/**
 * Settings for `FtpFactory`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/ftp-file-storage-adapter"`
 * @group Adapters
 */
export type FtpFactorySettings = FtpFactorySettingsBase & {
    /**
     * @default
     * ```ts
     * async (settings: FtpFactorySettingsBase) => {
     *   const client = new Client(settings.timeout, settings.clientSettings);
     *   await client.access(accessSettings);
     *   return client;
     * }
     * ```
     */
    clientFactory?: Invocable<
        [settings: FtpFactorySettingsBase],
        Promisable<Client>
    >;
};

/**
 * Resource factory that manages FTP client connections.
 *
 * `create` opens a client, upgrades it to TLS when configured, and logs in,
 * `validate` reports whether an existing client still responds, and `destroy`
 * closes the connection.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/ftp-file-storage-adapter"`
 * @group Adapters
 */
export class FtpFactory implements IResourceFactory<Client> {
    constructor(private readonly settings: FtpFactorySettings = {}) {}

    private static defaultClientFactory = async (
        settings: FtpFactorySettingsBase,
    ): Promise<Client> => {
        const client = new Client(settings.timeout, settings.clientSettings);
        await client.access(settings.accessSettings);
        return client;
    };

    async create(): Promise<Client> {
        const { clientFactory = FtpFactory.defaultClientFactory, ...settings } =
            this.settings;
        return callInvocable(clientFactory, settings);
    }

    destroy(client: Client): void {
        client.close();
    }

    async validate(client: Client): Promise<boolean> {
        if (client.closed) {
            return false;
        }
        try {
            await client.pwd();
            return true;
        } catch {
            return false;
        }
    }
}
