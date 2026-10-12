import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

export const database = new Kysely<any>({
    dialect: new SqliteDialect({
        database: new Sqlite("DATABASE_NAME.db"),
    }),
});
