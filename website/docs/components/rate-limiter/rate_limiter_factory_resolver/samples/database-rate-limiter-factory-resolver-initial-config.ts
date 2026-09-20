import { DatabaseRateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { TransactionContext } from "eridu-tech/transaction-context";
import { contextToken } from "eridu-tech/execution-context/contracts";

const serde = new Serde(new SuperJsonSerdeAdapter());
const kysely = new Kysely<any>({
    dialect: new SqliteDialect({
        database: new Sqlite("local.db"),
    }),
});
const kyselyTransactionAdapter = new KyselyTransactionAdapter({
    database: kysely,
});
const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const transactionContext = new TransactionContext<Kysely<any>>({
    token: contextToken("kysely"),
    executionContext,
    adapter: kyselyTransactionAdapter,
});

export const rateLimiterFactoryResolver =
    new DatabaseRateLimiterFactoryResolver({
        serde,
        adapters: {
            memory: new MemoryRateLimiterStorageAdapter(),
            sqlite: new KyselyRateLimiterStorageAdapter({
                transactionContext,
                serde,
            }),
        },
        defaultAdapter: "memory",
    });
