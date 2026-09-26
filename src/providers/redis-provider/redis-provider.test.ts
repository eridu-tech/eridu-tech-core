import { RedisContainer } from "@testcontainers/redis";
import { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    redisProvider,
    REDIS_CLIENT,
} from "@/providers/redis-provider/redis-provider.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { RedisSettings } from "@/providers/redis-provider/redis-provider.js";

const timeout = TimeSpan.fromMinutes(2);

describe("function: redisProvider", () => {
    let container: IContainer;
    let settings: RedisSettings;
    let startedContainer: StartedRedisContainer;

    beforeEach(async () => {
        startedContainer = await new RedisContainer("redis:7.4.2").start();
        settings = {
            host: startedContainer.getHost(),
            port: startedContainer.getPort(),
        };
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await startedContainer.stop();
    }, timeout.toMilliseconds());

    describe("method: init", () => {
        test("Should resolve the redis client", async () => {
            container.registerProvider(redisProvider(settings));

            await container.init();

            const client = await container.resolveOrFail(REDIS_CLIENT);
            expect(client).toBeInstanceOf(Redis);

            await container.deInit();
        });
        test("Should allow using the client before deInit", async () => {
            container.registerProvider(redisProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(REDIS_CLIENT);
            const result = await client.ping();

            expect(result).toBe("PONG");

            await container.deInit();
        });
    });
    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(redisProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(REDIS_CLIENT);
            await client.set("a", "b");

            await container.deInit();

            await expect(client.set("a", "b")).rejects.toThrow();
        });
    });
});
