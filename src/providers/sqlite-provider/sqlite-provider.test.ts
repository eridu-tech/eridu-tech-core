import Sqlite from "better-sqlite3";
import { beforeEach, describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    sqliteProvider,
    SQLITE_CLIENT,
} from "@/providers/sqlite-provider/sqlite-provider.js";

import type { IContainer } from "@/di/contracts/container.contract.js";

describe("function: sqliteProvider", () => {
    let container: IContainer;

    beforeEach(() => {
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
    });

    describe("method: init", () => {
        test("Should resolve the sqlite client", async () => {
            container.registerProvider(
                sqliteProvider({ filename: ":memory:" }),
            );

            await container.init();

            const client = await container.resolveOrFail(SQLITE_CLIENT);
            expect(client).toBeInstanceOf(Sqlite);

            await container.deInit();
        });
        test("Should allow using the client before deInit", async () => {
            container.registerProvider(
                sqliteProvider({ filename: ":memory:" }),
            );
            await container.init();

            const client = await container.resolveOrFail(SQLITE_CLIENT);
            const row = client.prepare("SELECT 1 AS value").get();

            expect(row).toEqual({ value: 1 });

            await container.deInit();
        });
        test("Should call the onInit callback with the client", async () => {
            container.registerProvider(
                sqliteProvider({
                    filename: ":memory:",
                    onInit: (client) => {
                        client.exec("CREATE TABLE coll (value INTEGER)");
                        client.exec("INSERT INTO coll (value) VALUES (1)");
                    },
                }),
            );

            await container.init();

            const client = await container.resolveOrFail(SQLITE_CLIENT);
            const row = client.prepare("SELECT value FROM coll").get();

            expect(row).toEqual({ value: 1 });

            await container.deInit();
        });
    });

    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(
                sqliteProvider({ filename: ":memory:" }),
            );
            await container.init();

            const client = await container.resolveOrFail(SQLITE_CLIENT);
            client.exec("CREATE TABLE coll (id INTEGER)");

            await container.deInit();

            expect(() =>
                client.exec("INSERT INTO coll (id) VALUES (1)"),
            ).toThrow();
        });
    });
});
