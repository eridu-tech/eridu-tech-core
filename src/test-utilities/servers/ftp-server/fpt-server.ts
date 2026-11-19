import { GenericContainer, Wait } from "testcontainers";

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { AccessOptions } from "basic-ftp";
import type { StartedTestContainer } from "testcontainers";

import type {
    IAsyncInitizable,
    IAsyncDeinitizable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type FtpServerSettings = {
    /**
     * @default "eridu"
     */
    FTP_USER_NAME?: string;

    /**
     * @default "eridu"
     */
    FTP_USER_PASS?: string;

    /**
     * @default 21
     */
    FTP_PORT?: number;

    /**
     * @default 32010
     */
    PASSIVE_PORT_START?: number;

    /**
     * @default 32019
     */
    PASSIVE_PORT_END?: number;

    /**
     * @default "127.0.0.1"
     */
    PUBLICHOST?: string;

    /**
     * @default "--tls=1"
     */
    ADDED_FLAGS?: string;

    /**
     * @default "localhost"
     */
    TLS_CN?: string;

    /**
     * @default "eridu-tech"
     */
    TLS_ORG?: string;

    /**
     * @default "DE"
     */
    TLS_C?: string;

    /**
     * @default "true"
     */
    TLS_USE_DSAPRAM?: string;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(2);
     * ```
     */
    startupTimeout?: TimeSpan;

    env?: Partial<Record<string, string>>;
};

/**
 * @internal
 */
export class FtpServer implements IAsyncInitizable, IAsyncDeinitizable {
    private static readonly FTP_IMAGE = "stilliard/pure-ftpd:hardened";
    private startedContainer: StartedTestContainer | null = null;
    private readonly settings: Required<FtpServerSettings>;

    constructor(settings: FtpServerSettings = {}) {
        const {
            FTP_USER_NAME = "eridu",
            FTP_USER_PASS = "eridu",
            FTP_PORT = 21,
            PASSIVE_PORT_START = 32010,
            PASSIVE_PORT_END = 32019,
            PUBLICHOST = "127.0.0.1",
            ADDED_FLAGS = "--tls=1",
            TLS_CN = "localhost",
            TLS_ORG = "eridu-tech",
            TLS_C = "DE",
            TLS_USE_DSAPRAM = "true",
            startupTimeout = TimeSpan.fromMinutes(2),
            env = {},
            ...rest
        } = settings;

        this.settings = {
            FTP_USER_NAME,
            FTP_USER_PASS,
            FTP_PORT,
            PASSIVE_PORT_START,
            PASSIVE_PORT_END,
            PUBLICHOST,
            ADDED_FLAGS,
            TLS_CN,
            TLS_ORG,
            TLS_C,
            TLS_USE_DSAPRAM,
            env,
            startupTimeout,
            ...rest,
        };
    }

    async init(): Promise<void> {
        const PASSIVE_PORTS = Array.from(
            {
                length:
                    this.settings.PASSIVE_PORT_END -
                    this.settings.PASSIVE_PORT_START +
                    1,
            },
            (_, index) => this.settings.PASSIVE_PORT_START + index,
        );
        this.startedContainer = await new GenericContainer(FtpServer.FTP_IMAGE)
            // The server advertises the passive ports itself, so they must be published 1:1.
            .withExposedPorts(
                this.settings.FTP_PORT,
                ...PASSIVE_PORTS.map((port) => ({
                    container: port,
                    host: port,
                })),
            )
            .withEnvironment({
                ...this.settings.env,
                FTP_USER_NAME: this.settings.FTP_USER_NAME,
                FTP_USER_PASS: this.settings.FTP_USER_PASS,
                FTP_USER_HOME: `/home/ftpusers/${this.settings.FTP_USER_NAME}`,
                FTP_PASSIVE_PORTS: [
                    this.settings.PASSIVE_PORT_START,
                    this.settings.PASSIVE_PORT_END,
                ].join(":"),
                PUBLICHOST: this.settings.PUBLICHOST,
                ADDED_FLAGS: this.settings.ADDED_FLAGS,
                TLS_CN: this.settings.TLS_CN,
                TLS_ORG: this.settings.TLS_ORG,
                TLS_C: this.settings.TLS_C,
                TLS_USE_DSAPRAM: this.settings.TLS_USE_DSAPRAM,
            })
            .withWaitStrategy(
                Wait.forSuccessfulCommand(
                    "bash -c 'exec 3<>/dev/tcp/127.0.0.1/21'",
                ).withStartupTimeout(
                    this.settings.startupTimeout.toMilliseconds(),
                ),
            )
            .start();
    }

    async deInit(): Promise<void> {
        await this.startedContainer?.stop();
    }

    getBasicFtpOptions(): AccessOptions {
        if (this.startedContainer === null) {
            throw UnexpectedError.create("!!__MESSAGE__!!");
        }
        return {
            host: this.startedContainer.getHost(),
            port: this.startedContainer.getMappedPort(this.settings.FTP_PORT),
            user: this.settings.FTP_USER_NAME,
            password: this.settings.FTP_USER_PASS,
        };
    }
}
