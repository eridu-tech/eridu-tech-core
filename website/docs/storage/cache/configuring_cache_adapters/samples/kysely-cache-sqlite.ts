import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import {
    createTransactionContext,
    serde,
} from "./kysely-cache-adapter-setup.js";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely<any>({
    dialect: new SqliteDialect({
        database,
    }),
});
const transactionContext = createTransactionContext(kysely);
export const kyselyCacheAdapter = new KyselyCacheAdapter({
    transactionContext,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCacheAdapter.init();
