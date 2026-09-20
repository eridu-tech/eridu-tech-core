import { KyselyLockAdapter } from "eridu-tech/lock/kysely-lock-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { createTransactionContext } from "./kysely-lock-adapter-setup.js";

const kysely = new Kysely<any>({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const transactionContext = createTransactionContext(kysely);
const kyselyLockAdapter = new KyselyLockAdapter({
    transactionContext,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyLockAdapter.init();
