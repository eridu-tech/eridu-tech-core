import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import {
    createTransactionContext,
    serde,
} from "./kysely-rate-limiter-adapter-setup.js";

const kysely = new Kysely<any>({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const transactionContext = createTransactionContext(kysely);
const kyselyRateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
    transactionContext,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyRateLimiterStorageAdapter.init();
