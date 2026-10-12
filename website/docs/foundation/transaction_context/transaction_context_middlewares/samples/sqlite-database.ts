import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

export const sqliteDatabase = new Kysely<any>({
    dialect: new SqliteDialect({ database: new Sqlite(":memory:") }),
});
