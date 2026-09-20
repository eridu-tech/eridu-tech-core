import { KyselySharedLockAdapter } from "eridu-tech/shared-lock/kysely-shared-lock-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";
import { createTransactionContext } from "./kysely-shared-lock-adapter-setup.js";

const kysely = new Kysely<any>({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});
const transactionContext = createTransactionContext(kysely);
const kyselySharedLockAdapter = new KyselySharedLockAdapter({
    transactionContext,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySharedLockAdapter.init();
