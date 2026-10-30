import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { KyselyCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { TransactionContext } from "eridu-tech/transaction-context";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";

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

export const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
    serde,
    adapters: {
        memory: new DatabaseCircuitBreakerAdapter({
            adapter: new MemoryCircuitBreakerStorageAdapter(),
        }),
        sqlite: new DatabaseCircuitBreakerAdapter({
            adapter: new KyselyCircuitBreakerStorageAdapter({
                transactionContext,
                serde,
            }),
        }),
    },
    defaultAdapter: "memory",
});

await circuitBreakerFactoryResolver.init();
