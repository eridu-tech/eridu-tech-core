import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    kyselyPostgresProvider,
    KYSELY_POSTGRES,
} from "@/providers/kysely-postgres-provider/kysely-postgres-provider.js";
import {
    postgresProvider,
    POSTGRES_CLIENT,
} from "@/providers/postgres-provider/postgres-provider.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { KyselyPostgresProviderSettings } from "@/providers/kysely-postgres-provider/kysely-postgres-provider.js";
import type { PostgresProviderSettings } from "@/providers/postgres-provider/postgres-provider.js";

const timeout = TimeSpan.fromMinutes(2);

describe("function: kyselyPostgresProvider", () => {
    let clientSettings: PostgresProviderSettings;
    let container: IContainer;
    let settings: KyselyPostgresProviderSettings;
    let startedContainer: StartedPostgreSqlContainer;

    beforeEach(async () => {
        startedContainer = await new PostgreSqlContainer(
            "postgres:17.5",
        ).start();
        clientSettings = {
            host: startedContainer.getHost(),
            port: startedContainer.getPort(),
            database: startedContainer.getDatabase(),
            user: startedContainer.getUsername(),
            password: startedContainer.getPassword(),
        };
        settings = { postgresToken: POSTGRES_CLIENT };
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
        test("Should resolve the kysely client", async () => {
            container.registerProvider(postgresProvider(clientSettings));
            container.registerProvider(kyselyPostgresProvider(settings));

            await container.init();

            const kysely = await container.resolveOrFail(KYSELY_POSTGRES);
            await sql`CREATE TABLE coll (value INTEGER)`.execute(kysely);
            await sql`INSERT INTO coll (value) VALUES (1)`.execute(kysely);
            const result = await sql`SELECT value FROM coll`.execute(kysely);

            expect(result.rows).toEqual([{ value: 1 }]);

            await container.deInit();
        });
    });

    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(postgresProvider(clientSettings));
            container.registerProvider(kyselyPostgresProvider(settings));
            await container.init();

            const kysely = await container.resolveOrFail(KYSELY_POSTGRES);
            await sql`CREATE TABLE coll (value INTEGER)`.execute(kysely);

            await container.deInit();

            await expect(
                sql`INSERT INTO coll (value) VALUES (1)`.execute(kysely),
            ).rejects.toThrow();
        });
    });
});
