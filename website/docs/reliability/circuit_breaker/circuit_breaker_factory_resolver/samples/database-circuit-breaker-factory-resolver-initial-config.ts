import { DatabaseCircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { KyselyCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { TransactionContext } from "eridu-tech/transaction-context";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";

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

export const circuitBreakerFactoryResolver =
    new DatabaseCircuitBreakerFactoryResolver({
        serde,
        adapters: {
            memory: new MemoryCircuitBreakerStorageAdapter(),
            sqlite: new KyselyCircuitBreakerStorageAdapter({
                transactionContext,
                serde,
            }),
        },
        defaultAdapter: "memory",
    });
