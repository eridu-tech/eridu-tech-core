import { KyselyCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import {
    createTransactionContext,
    serde,
} from "./kysely-circuit-breaker-storage-adapter-setup.js";

const kysely = new Kysely<any>({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const transactionContext = createTransactionContext(kysely);
const kyselyCircuitBreakerStorageAdapter =
    new KyselyCircuitBreakerStorageAdapter({
        transactionContext,
        serde,
    });

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCircuitBreakerStorageAdapter.init();
