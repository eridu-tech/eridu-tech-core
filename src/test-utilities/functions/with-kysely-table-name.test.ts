import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { afterAll, describe, expect, test } from "vitest";

import { WithKyselyTableName } from "@/test-utilities/functions/with-kysely-table-name.js";

type Database = {
    person: {
        id: number;
        name: string;
    };
};

describe(
    "class: WithKyselyTableName",
    { tags: ["Postgres", "TestUtilities"] },
    () => {
        const pool = new Pool();
        const kysely = new Kysely<Database>({
            dialect: new PostgresDialect({ pool }),
            plugins: [new WithKyselyTableName({ person: "person_test" })],
        });

        afterAll(async () => {
            await pool.end();
        });

        test("Should rename the table when selecting", () => {
            const query = kysely.selectFrom("person").selectAll().compile();

            expect(query.sql).toBe('select * from "person_test"');
        });
        test("Should rename the table when inserting", () => {
            const query = kysely
                .insertInto("person")
                .values({ id: 1, name: "eridu" })
                .compile();

            expect(query.sql).toBe(
                'insert into "person_test" ("id", "name") values ($1, $2)',
            );
        });
        test("Should rename the table when updating", () => {
            const query = kysely
                .updateTable("person")
                .set({ name: "eridu" })
                .compile();

            expect(query.sql).toBe('update "person_test" set "name" = $1');
        });
        test("Should rename the table when deleting", () => {
            const query = kysely.deleteFrom("person").compile();

            expect(query.sql).toBe('delete from "person_test"');
        });
        test("Should rename the table when creating it", () => {
            const query = kysely.schema
                .createTable("person")
                .addColumn("id", "integer")
                .compile();

            expect(query.sql).toBe('create table "person_test" ("id" integer)');
        });
        test("Should rename table references but keep table aliases", () => {
            const query = kysely
                .selectFrom("person")
                .innerJoin("person as p2", "p2.id", "person.id")
                .selectAll()
                .compile();

            expect(query.sql).toBe(
                'select * from "person_test" inner join "person_test" as "p2" on "p2"."id" = "person_test"."id"',
            );
        });
        test("Should keep tables that are missing from the map", () => {
            const identityKysely = new Kysely<Database>({
                dialect: new PostgresDialect({ pool }),
                plugins: [new WithKyselyTableName({})],
            });
            const query = identityKysely
                .selectFrom("person")
                .selectAll()
                .compile();

            expect(query.sql).toBe('select * from "person"');
        });
    },
);
