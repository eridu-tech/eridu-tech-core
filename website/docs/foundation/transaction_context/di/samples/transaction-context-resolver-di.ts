import { genericToken, LIFETIME } from "eridu-tech/di/contracts";
import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { ProxyTransactionContextResolver } from "eridu-tech/transaction-context/di";
import { TransactionContextResolver } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

type Adapters = "primary" | "secondary";

const primaryDatabase = new Kysely<any>({
    dialect: new SqliteDialect({ database: new Sqlite(":memory:") }),
});
const secondaryDatabase = new Kysely<any>({
    dialect: new SqliteDialect({ database: new Sqlite(":memory:") }),
});
const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });
const resolverToken = genericToken<TransactionContextResolver<Adapters>>(
    "transactionContextResolver",
);

container.registerFactory({
    token: resolverToken,
    factory: () =>
        new TransactionContextResolver<Adapters>({
            adapters: {
                primary: new KyselyTransactionAdapter({
                    database: primaryDatabase,
                }),
                secondary: new KyselyTransactionAdapter({
                    database: secondaryDatabase,
                }),
            },
            defaultAdapter: "primary",
            executionContext,
        }),
    onInit: async (resolver) => {
        await resolver.init();
    },
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

// Create the proxy before container.init()
export const transactionContext =
    new ProxyTransactionContextResolver<Adapters>({
        container,
        resolverToken,
    });

await container.init();
