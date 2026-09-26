import { sql } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    kyselySqliteProvider,
    KYSELY_SQLITE,
} from "@/providers/kysely-sqlite-provider/kysely-sqlite-provider.js";
import {
    sqliteProvider,
    SQLITE_CLIENT,
} from "@/providers/sqlite-provider/sqlite-provider.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { KyselySqliteProviderSettings } from "@/providers/kysely-sqlite-provider/kysely-sqlite-provider.js";
import type { SqliteProviderSettings } from "@/providers/sqlite-provider/sqlite-provider.js";

describe("function: kyselySqliteProvider", () => {
    let clientSettings: SqliteProviderSettings;
    let container: IContainer;
    let settings: KyselySqliteProviderSettings;

    beforeEach(() => {
        clientSettings = { filename: ":memory:" };
        settings = { sqliteToken: SQLITE_CLIENT };
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
    });

    describe("method: init", () => {
        test("Should resolve the kysely client", async () => {
            container.registerProvider(sqliteProvider(clientSettings));
            container.registerProvider(kyselySqliteProvider(settings));

            await container.init();

            const kysely = await container.resolveOrFail(KYSELY_SQLITE);
            await sql`CREATE TABLE coll (value INTEGER)`.execute(kysely);
            await sql`INSERT INTO coll (value) VALUES (1)`.execute(kysely);
            const result = await sql`SELECT value FROM coll`.execute(kysely);

            expect(result.rows).toEqual([{ value: 1 }]);

            await container.deInit();
        });
    });

    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(sqliteProvider(clientSettings));
            container.registerProvider(kyselySqliteProvider(settings));
            await container.init();

            const kysely = await container.resolveOrFail(KYSELY_SQLITE);
            await sql`CREATE TABLE coll (value INTEGER)`.execute(kysely);

            await container.deInit();

            await expect(
                sql`INSERT INTO coll (value) VALUES (1)`.execute(kysely),
            ).rejects.toThrow();
        });
    });
});
