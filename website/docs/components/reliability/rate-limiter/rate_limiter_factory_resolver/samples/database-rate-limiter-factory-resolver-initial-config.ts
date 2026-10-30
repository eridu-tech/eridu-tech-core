import { RateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { TransactionContext } from "eridu-tech/transaction-context";
import { contextToken } from "eridu-tech/execution-context/contracts";

const serde = new SuperJsonSerde();
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

export const rateLimiterFactoryResolver = new RateLimiterFactoryResolver({
    serde,
    adapters: {
        memory: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter(),
        }),
        sqlite: new DatabaseRateLimiterAdapter({
            adapter: new KyselyRateLimiterStorageAdapter({
                transactionContext,
                serde,
            }),
        }),
    },
    defaultAdapter: "memory",
});

await rateLimiterFactoryResolver.init();
