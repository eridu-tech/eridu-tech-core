import { KyselySemaphoreAdapter } from "eridu-tech/semaphore/kysely-semaphore-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { createTransactionContext } from "./kysely-semaphore-adapter-setup.js";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely<any>({
    dialect: new SqliteDialect({
        database,
    }),
});
const transactionContext = createTransactionContext(kysely);
export const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    transactionContext,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
