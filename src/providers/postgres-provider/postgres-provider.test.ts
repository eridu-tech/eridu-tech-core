import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    postgresProvider,
    POSTGRES_CLIENT,
} from "@/providers/postgres-provider/postgres-provider.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { PostgresProviderSettings } from "@/providers/postgres-provider/postgres-provider.js";

const timeout = TimeSpan.fromMinutes(2);

describe("function: postgresProvider", () => {
    let container: IContainer;
    let settings: PostgresProviderSettings;
    let startedContainer: StartedPostgreSqlContainer;

    beforeEach(async () => {
        startedContainer = await new PostgreSqlContainer(
            "postgres:17.5",
        ).start();
        settings = {
            host: startedContainer.getHost(),
            port: startedContainer.getPort(),
            database: startedContainer.getDatabase(),
            user: startedContainer.getUsername(),
            password: startedContainer.getPassword(),
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
        test("Should resolve the postgres client", async () => {
            container.registerProvider(postgresProvider(settings));

            await container.init();

            const client = await container.resolveOrFail(POSTGRES_CLIENT);
            expect(client).toBeInstanceOf(Pool);

            await container.deInit();
        });
        test("Should allow using the client before deInit", async () => {
            container.registerProvider(postgresProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(POSTGRES_CLIENT);
            const result = await client.query("SELECT 1 AS value");

            expect(result.rows).toEqual([{ value: 1 }]);

            await container.deInit();
        });
        test("Should call the onInit callback with the client", async () => {
            container.registerProvider(
                postgresProvider({
                    ...settings,
                    onInit: async (client) => {
                        await client.query("CREATE TABLE coll (value INTEGER)");
                        await client.query(
                            "INSERT INTO coll (value) VALUES (1)",
                        );
                    },
                }),
            );

            await container.init();

            const client = await container.resolveOrFail(POSTGRES_CLIENT);
            const result = await client.query("SELECT value FROM coll");

            expect(result.rows).toEqual([{ value: 1 }]);

            await container.deInit();
        });
    });

    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(postgresProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(POSTGRES_CLIENT);
            await client.query("CREATE TABLE coll (id INTEGER)");

            await container.deInit();

            await expect(
                client.query("INSERT INTO coll (id) VALUES (1)"),
            ).rejects.toThrow();
        });
    });
});
