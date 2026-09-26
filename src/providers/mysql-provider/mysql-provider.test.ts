import { MySqlContainer } from "@testcontainers/mysql";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    mysqlProvider,
    MYSQL_CLIENT,
} from "@/providers/mysql-provider/mysql-provider.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedMySqlContainer } from "@testcontainers/mysql";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { MysqlProviderSettings } from "@/providers/mysql-provider/mysql-provider.js";

const timeout = TimeSpan.fromMinutes(2);

describe("function: mysqlProvider", () => {
    let container: IContainer;
    let settings: MysqlProviderSettings;
    let startedContainer: StartedMySqlContainer;

    beforeEach(async () => {
        startedContainer = await new MySqlContainer("mysql:9.3.0").start();
        settings = {
            host: startedContainer.getHost(),
            port: startedContainer.getPort(),
            database: startedContainer.getDatabase(),
            user: startedContainer.getUsername(),
            password: startedContainer.getUserPassword(),
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
        test("Should resolve the mysql client", async () => {
            container.registerProvider(mysqlProvider(settings));

            await container.init();

            const client = await container.resolveOrFail(MYSQL_CLIENT);
            expect(typeof client.query).toBe("function");
            expect(typeof client.getConnection).toBe("function");

            await container.deInit();
        });
        test("Should allow using the client before deInit", async () => {
            container.registerProvider(mysqlProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(MYSQL_CLIENT);
            const [rows] = await client.promise().query("SELECT 1 AS value");

            expect(rows).toEqual([{ value: 1 }]);

            await container.deInit();
        });
        test("Should call the onInit callback with the client", async () => {
            container.registerProvider(
                mysqlProvider({
                    ...settings,
                    onInit: async (client) => {
                        await client
                            .promise()
                            .query("CREATE TABLE coll (value INTEGER)");
                        await client
                            .promise()
                            .query("INSERT INTO coll (value) VALUES (1)");
                    },
                }),
            );

            await container.init();

            const client = await container.resolveOrFail(MYSQL_CLIENT);
            const [rows] = await client
                .promise()
                .query("SELECT value FROM coll");

            expect(rows).toEqual([{ value: 1 }]);

            await container.deInit();
        });
    });

    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(mysqlProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(MYSQL_CLIENT);
            await client.promise().query("CREATE TABLE coll (id INTEGER)");

            await container.deInit();

            await expect(
                client.promise().query("INSERT INTO coll (id) VALUES (1)"),
            ).rejects.toThrow();
        });
    });
});
