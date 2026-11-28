import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import type { KyselyRateLimiterTables } from "eridu-tech/rate-limiter/kysely-rate-limiter-adapter";
import type { ITransactionContext } from "eridu-tech/transaction-context/contracts";
import type { Kysely } from "kysely";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

// `KyselyRateLimiterAdapter` is transaction aware: it runs every
// rate-limiter operation through the `current` client of this context, which
// is the transaction-scoped client while a transaction is active and the base
// client otherwise.
export function createTransactionContext(
    kysely: Kysely<KyselyRateLimiterTables>,
): ITransactionContext<Kysely<KyselyRateLimiterTables>> {
    return new TransactionContext<Kysely<KyselyRateLimiterTables>>({
        token: contextToken("kysely"),
        adapter: new KyselyTransactionAdapter({
            database: kysely,
        }),
        executionContext,
    });
}
