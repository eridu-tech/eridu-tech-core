import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import {
    createTransactionContext,
    serde,
} from "./kysely-cache-adapter-setup.js";

const kysely = new Kysely<any>({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const transactionContext = createTransactionContext(kysely);
const kyselyCacheAdapter = new KyselyCacheAdapter({
    transactionContext,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCacheAdapter.init();
