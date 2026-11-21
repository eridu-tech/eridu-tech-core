import { GenericContainer, Wait } from "testcontainers";

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { StartedTestContainer } from "testcontainers";

import type { ITestServer } from "@/test-utilities/servers/_shared.js";

/**
 * @internal
 */
export type WebdavServerSettings = {
    /**
     * @default "eridu"
     */
    USER_NAME?: string;

    /**
     * @default "eridu"
     */
    USER_PASS?: string;

    /**
     * @default 6065
     */
    PORT?: number;

    /**
     * @default "/data"
     */
    DIRECTORY?: string;

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
export type WebdavServerConnectionSettings = {
    url: string;
    username: string;
    password: string;
};

/**
 * @internal
 */
export class WebdavServer implements ITestServer<WebdavServerConnectionSettings> {
    private static readonly WEBDAV_IMAGE = "hacdias/webdav:v5.17.1";
    private startedContainer: StartedTestContainer | null = null;
    private readonly settings: Required<WebdavServerSettings>;

    constructor(settings: WebdavServerSettings = {}) {
        const {
            USER_NAME = "eridu",
            USER_PASS = "eridu",
            PORT = 6065,
            DIRECTORY = "/data",
            startupTimeout = TimeSpan.fromMinutes(2),
            env = {},
        } = settings;

        this.settings = {
            USER_NAME,
            USER_PASS,
            PORT,
            DIRECTORY,
            startupTimeout,
            env,
        };
    }

    // hacdias/webdav only reads its configuration from a file, so it is copied
    // into the scratch-based image before the container starts.
    private getConfig(): string {
        return `
address: 0.0.0.0
port: ${String(this.settings.PORT)}
directory: ${this.settings.DIRECTORY}
permissions: CRUD
users:
  - username: ${this.settings.USER_NAME}
    password: ${this.settings.USER_PASS}
`;
    }

    async init(): Promise<void> {
        this.startedContainer = await new GenericContainer(
            WebdavServer.WEBDAV_IMAGE,
        )
            .withCopyContentToContainer([
                { content: this.getConfig(), target: "/config.yml" },
            ])
            .withEnvironment(this.settings.env)
            .withTmpFs({ [this.settings.DIRECTORY]: "rw" })
            .withExposedPorts(this.settings.PORT)
            .withCommand(["-c", "/config.yml"])
            .withWaitStrategy(
                Wait.forHttp("/", this.settings.PORT)
                    .withBasicCredentials(
                        this.settings.USER_NAME,
                        this.settings.USER_PASS,
                    )
                    .forStatusCodeMatching((statusCode) => {
                        return statusCode >= 200 && statusCode < 300;
                    })
                    .withStartupTimeout(
                        this.settings.startupTimeout.toMilliseconds(),
                    ),
            )
            .start();
    }

    async deInit(): Promise<void> {
        await this.startedContainer?.stop();
    }

    getSettings(): WebdavServerConnectionSettings {
        if (this.startedContainer === null) {
            throw UnexpectedError.create(
                "WebdavServer.init() must be called before using the server",
            );
        }
        return {
            url: `http://${this.startedContainer.getHost()}:${String(this.startedContainer.getMappedPort(this.settings.PORT))}`,
            username: this.settings.USER_NAME,
            password: this.settings.USER_PASS,
        };
    }
}
