import { GenericContainer, Wait } from "testcontainers";

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type SftpClient from "ssh2-sftp-client";
import type { StartedTestContainer } from "testcontainers";

import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type SftpServerSettings = {
    /**
     * @default "eridu"
     */
    USER_NAME?: string;

    /**
     * @default "eridu"
     */
    USER_PASS?: string;

    /**
     * @default 22
     */
    SFTP_PORT?: number;

    /**
     * Directory of the SFTP user inside its chroot, relative to the user home.
     *
     * @default "upload"
     */
    HOME_DIRECTORY?: string;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(2);
     * ```
     */
    startupTimeout?: TimeSpan;

    env?: Record<string, string>;
};

/**
 * @internal
 */
export class SftpServer implements IAsyncInitizable, IAsyncDeinitizable {
    private static readonly SFTP_IMAGE = "atmoz/sftp";
    private startedContainer: StartedTestContainer | null = null;
    private readonly settings: Required<SftpServerSettings>;

    constructor(settings: SftpServerSettings = {}) {
        const {
            USER_NAME = "eridu",
            USER_PASS = "eridu",
            SFTP_PORT = 22,
            HOME_DIRECTORY = "upload",
            startupTimeout = TimeSpan.fromMinutes(2),
            env = {},
        } = settings;

        this.settings = {
            USER_NAME,
            USER_PASS,
            SFTP_PORT,
            HOME_DIRECTORY,
            startupTimeout,
            env,
        };
    }

    async init(): Promise<void> {
        this.startedContainer = await new GenericContainer(
            SftpServer.SFTP_IMAGE,
        )
            .withExposedPorts(this.settings.SFTP_PORT)
            .withEnvironment(this.settings.env)
            .withCommand([
                `${this.settings.USER_NAME}:${this.settings.USER_PASS}:::${this.settings.HOME_DIRECTORY}`,
            ])
            .withWaitStrategy(
                Wait.forAll([
                    Wait.forListeningPorts(),
                    // `forLogMessage` does a plain substring match for string
                    // arguments, so regex syntax such as `\\.` or the surrounding
                    // slashes would never match the container output.
                    Wait.forLogMessage(
                        `Server listening on 0.0.0.0 port ${String(this.settings.SFTP_PORT)}.`,
                    ),
                ]).withStartupTimeout(
                    this.settings.startupTimeout.toMilliseconds(),
                ),
            )
            .start();
    }

    async deInit(): Promise<void> {
        await this.startedContainer?.stop();
    }

    private requireContainer(): StartedTestContainer {
        if (this.startedContainer === null) {
            throw UnexpectedError.create(
                "SftpServer.init() must be called before using the server",
            );
        }
        return this.startedContainer;
    }

    getConnectionSettings(): SftpClient.ConnectOptions {
        const container = this.requireContainer();
        return {
            host: container.getHost(),
            port: container.getMappedPort(this.settings.SFTP_PORT),
            username: this.settings.USER_NAME,
            password: this.settings.USER_PASS,
        };
    }

    /**
     * Absolute path of the directory the SFTP user is chrooted to.
     */
    getHomeDirectory(): string {
        return `/${this.settings.HOME_DIRECTORY.replace(/^\/+/, "")}`;
    }
}
