import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import type { KyselyCircuitBreakerTables } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter";
import type { ITransactionContext } from "eridu-tech/transaction-context/contracts";
import type { Kysely } from "kysely";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

// `KyselyCircuitBreakerAdapter` is transaction aware: it runs every
// circuit-breaker operation through the `current` client of this context,
// which is the transaction-scoped client while a transaction is active and the
// base client otherwise.
export function createTransactionContext(
    kysely: Kysely<KyselyCircuitBreakerTables>,
): ITransactionContext<Kysely<KyselyCircuitBreakerTables>> {
    return new TransactionContext<Kysely<KyselyCircuitBreakerTables>>({
        token: contextToken("kysely"),
        adapter: new KyselyTransactionAdapter({
            database: kysely,
        }),
        executionContext,
    });
}
