import { GenericContainer, Wait } from "testcontainers";

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { S3ClientConfig } from "@aws-sdk/client-s3";
import type { StartedTestContainer } from "testcontainers";

import type { ITestServer } from "@/test-utilities/servers/_shared.js";

/**
 * @internal
 */
export type S3ServerSettings = {
    /**
     * @default "files"
     */
    BUCKET?: string;

    /**
     * @default "GK0123456789abcdef0123456789abcdef"
     */
    ACCESS_KEY_ID?: string;

    /**
     * @default "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
     */
    SECRET_ACCESS_KEY?: string;

    /**
     * @default "garage"
     */
    REGION?: string;

    /**
     * @default 3900
     */
    S3_PORT?: number;

    /**
     * @default 3901
     */
    RPC_PORT?: number;

    /**
     * @default 3902
     */
    WEB_PORT?: number;

    /**
     * @default ".web.garage.localhost"
     */
    ROOT_DOMAIN?: string;

    /**
     * @default "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
     */
    RPC_SECRET?: string;

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
export class S3Server implements ITestServer<S3ClientConfig> {
    private static readonly S3_IMAGE = "dxflrs/garage:v2.4.1";
    private startedContainer: StartedTestContainer | null = null;
    private readonly settings: Required<S3ServerSettings>;

    constructor(settings: S3ServerSettings = {}) {
        const {
            BUCKET = "files",
            ACCESS_KEY_ID = "GK0123456789abcdef0123456789abcdef",
            SECRET_ACCESS_KEY = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
            REGION = "garage",
            S3_PORT = 3900,
            RPC_PORT = 3901,
            WEB_PORT = 3902,
            ROOT_DOMAIN = ".web.garage.localhost",
            RPC_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            startupTimeout = TimeSpan.fromMinutes(2),
            env = {},
        } = settings;

        this.settings = {
            BUCKET,
            ACCESS_KEY_ID,
            SECRET_ACCESS_KEY,
            REGION,
            S3_PORT,
            RPC_PORT,
            WEB_PORT,
            ROOT_DOMAIN,
            RPC_SECRET,
            startupTimeout,
            env,
        };
    }

    // Garage requires a configuration file, the `--single-node` and
    // `--default-bucket` flags create the cluster layout, the access key and the
    // bucket used by the tests.
    private getConfig(): string {
        return `
metadata_dir = "/tmp/meta"
data_dir = "/tmp/data"
db_engine = "sqlite"

replication_factor = 1

rpc_bind_addr = "[::]:${String(this.settings.RPC_PORT)}"
rpc_public_addr = "127.0.0.1:${String(this.settings.RPC_PORT)}"
rpc_secret = "${this.settings.RPC_SECRET}"

[s3_api]
s3_region = "${this.settings.REGION}"
api_bind_addr = "[::]:${String(this.settings.S3_PORT)}"

[s3_web]
bind_addr = "[::]:${String(this.settings.WEB_PORT)}"
root_domain = "${this.settings.ROOT_DOMAIN}"
index = "index.html"
`;
    }

    async init(): Promise<void> {
        this.startedContainer = await new GenericContainer(S3Server.S3_IMAGE)
            .withCopyContentToContainer([
                { content: this.getConfig(), target: "/etc/garage.toml" },
            ])
            .withEnvironment({
                ...this.settings.env,
                GARAGE_DEFAULT_ACCESS_KEY: this.settings.ACCESS_KEY_ID,
                GARAGE_DEFAULT_SECRET_KEY: this.settings.SECRET_ACCESS_KEY,
                GARAGE_DEFAULT_BUCKET: this.settings.BUCKET,
            })
            .withExposedPorts(this.settings.S3_PORT, this.settings.WEB_PORT)
            .withCommand([
                "/garage",
                "server",
                "--single-node",
                "--default-bucket",
            ])
            .withWaitStrategy(
                Wait.forLogMessage(
                    "S3 API server listening on",
                ).withStartupTimeout(
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
                "S3Server.init() must be called before using the server",
            );
        }
        return this.startedContainer;
    }

    getBucket(): string {
        return this.settings.BUCKET;
    }

    getEndpoint(): string {
        const container = this.requireContainer();
        return `http://${container.getHost()}:${String(container.getMappedPort(this.settings.S3_PORT))}`;
    }

    getBucketWebUrl(bucket: string = this.settings.BUCKET): string {
        const container = this.requireContainer();
        return `http://${bucket}${this.settings.ROOT_DOMAIN}:${String(container.getMappedPort(this.settings.WEB_PORT))}`;
    }

    getSettings(): S3ClientConfig {
        return {
            endpoint: this.getEndpoint(),
            region: this.settings.REGION,
            credentials: {
                accessKeyId: this.settings.ACCESS_KEY_ID,
                secretAccessKey: this.settings.SECRET_ACCESS_KEY,
            },
            forcePathStyle: true,
            // Garage rejects presigned uploads when the SDK attaches a
            // precomputed checksum for the empty body.
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
        };
    }
}
