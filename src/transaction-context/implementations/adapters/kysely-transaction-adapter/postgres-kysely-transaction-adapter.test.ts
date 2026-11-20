import { randomUUID } from "node:crypto";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";

import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/kysely-transaction-adapter.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

const timeout = TimeSpan.fromMinutes(2);
describe("postgres class: KyselyTransactionAdapter", { tags: ["Postgres"] }, () => {
    let container: StartedPostgreSqlContainer;
    let database: Pool;
    let kysely: Kysely<Database>;

    type Person = {
        id: number;
        name: string;
    };
    type Database = {
        person: Person;
    };

    beforeAll(async () => {
        container = await new PostgreSqlContainer("postgres:17.5").start();
        database = new Pool({
            database: container.getDatabase(),
            host: container.getHost(),
            user: container.getUsername(),
            port: container.getPort(),
            password: container.getPassword(),
            max: 10,
        });
    }, timeout.toMilliseconds());
    afterAll(async () => {
        await database.end();
        await container.stop();
    }, timeout.toMilliseconds());
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetAllMocks();

        const tableNames: Record<keyof Database, string> = {
            person: randomUUID(),
        };
        kysely = new Kysely({
            dialect: new PostgresDialect({
                pool: database,
            }),
            plugins: [new WithKyselyTableName(tableNames)],
        });
        await kysely.schema
            .createTable("person")
            .addColumn("id", "integer", (column) => column.primaryKey())
            .addColumn("name", "varchar(255)", (column) => column.notNull())
            .execute();
    });

    describe("getter: client", () => {
        test("Should return the configured Kysely client", () => {
            const adapter = new KyselyTransactionAdapter({ database: kysely });

            expect(adapter.client).toBe(kysely);
        });
    });
    describe("method: start", () => {
        test("Should persist the changes when the transaction is committed", async () => {
            const adapter = new KyselyTransactionAdapter({ database: kysely });
            const transaction = await adapter.start();
            const transactionClient = transaction.client;

            await transactionClient
                .insertInto("person")
                .values({ id: 1, name: "eridu" })
                .execute();
            await transaction.commit();

            const persons = await kysely
                .selectFrom("person")
                .selectAll()
                .execute();

            expect(persons).toEqual([{ id: 1, name: "eridu" }]);
        });
        test("Should discard the changes when the transaction is aborted", async () => {
            const adapter = new KyselyTransactionAdapter({ database: kysely });
            const transaction = await adapter.start();
            const transactionClient = transaction.client;

            await transactionClient
                .insertInto("person")
                .values({ id: 1, name: "eridu" })
                .execute();
            await transaction.abort();

            const persons = await kysely
                .selectFrom("person")
                .selectAll()
                .execute();

            expect(persons).toEqual([]);
        });
        test("Should enforce a read only access mode", async () => {
            const adapter = new KyselyTransactionAdapter({
                database: kysely,
                accessMode: "read only",
                isolationLevel: "read committed",
            });
            const transaction = await adapter.start();
            const transactionClient = transaction.client;

            const promise = transactionClient
                .insertInto("person")
                .values({ id: 1, name: "eridu" })
                .execute();

            await expect(promise).rejects.toThrow();
            await transaction.abort();
        });
        test("Should pass the configured access mode and isolation level to the underlying Kysely client", async () => {
            const accessMode = "read only";
            const isolationLevel = "read committed";
            const adapter = new KyselyTransactionAdapter({
                database: kysely,
                accessMode,
                isolationLevel,
            });

            const execute = vi.fn().mockResolvedValue({});
            const setIsolationLevel = vi.fn(() => ({ execute }));
            const setAccessMode = vi.fn(() => ({ setIsolationLevel }));
            const startTransactionSpy = vi
                .spyOn(kysely, "startTransaction")
                .mockReturnValue({ setAccessMode } as unknown as ReturnType<
                    typeof kysely.startTransaction
                >);

            await adapter.start();

            expect(startTransactionSpy).toHaveBeenCalledTimes(1);
            expect(setAccessMode).toHaveBeenCalledWith(accessMode);
            expect(setIsolationLevel).toHaveBeenCalledWith(isolationLevel);
            expect(execute).toHaveBeenCalledTimes(1);
        });
    });
});
