import { MySqlContainer } from "@testcontainers/mysql";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    kyselyMysqlProvider,
    KYSELY_MYSQL,
} from "@/providers/kysely-mysql-provider/kysely-mysql-provider.js";
import {
    mysqlProvider,
    MYSQL_CLIENT,
} from "@/providers/mysql-provider/mysql-provider.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedMySqlContainer } from "@testcontainers/mysql";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { KyselyMysqlProviderSettings } from "@/providers/kysely-mysql-provider/kysely-mysql-provider.js";
import type { MysqlProviderSettings } from "@/providers/mysql-provider/mysql-provider.js";

const timeout = TimeSpan.fromMinutes(2);

describe("function: kyselyMysqlProvider", () => {
    let clientSettings: MysqlProviderSettings;
    let container: IContainer;
    let settings: KyselyMysqlProviderSettings;
    let startedContainer: StartedMySqlContainer;

    beforeEach(async () => {
        startedContainer = await new MySqlContainer("mysql:9.3.0").start();
        clientSettings = {
            host: startedContainer.getHost(),
            port: startedContainer.getPort(),
            database: startedContainer.getDatabase(),
            user: startedContainer.getUsername(),
            password: startedContainer.getUserPassword(),
        };
        settings = { mysqlToken: MYSQL_CLIENT };
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
            container.registerProvider(mysqlProvider(clientSettings));
            container.registerProvider(kyselyMysqlProvider(settings));

            await container.init();

            const kysely = await container.resolveOrFail(KYSELY_MYSQL);
            await sql`CREATE TABLE coll (value INTEGER)`.execute(kysely);
            await sql`INSERT INTO coll (value) VALUES (1)`.execute(kysely);
            const result = await sql`SELECT value FROM coll`.execute(kysely);

            expect(result.rows).toEqual([{ value: 1 }]);

            await container.deInit();
        });
    });

    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(mysqlProvider(clientSettings));
            container.registerProvider(kyselyMysqlProvider(settings));
            await container.init();

            const kysely = await container.resolveOrFail(KYSELY_MYSQL);
            await sql`CREATE TABLE coll (value INTEGER)`.execute(kysely);

            await container.deInit();

            await expect(
                sql`INSERT INTO coll (value) VALUES (1)`.execute(kysely),
            ).rejects.toThrow();
        });
    });
});
