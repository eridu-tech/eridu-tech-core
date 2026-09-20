import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import type { ITransactionContext } from "eridu-tech/transaction-context/contracts";
import type { Kysely } from "kysely";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

// `KyselySharedLockAdapter` is transaction aware: it runs every shared-lock
// operation through the `current` client of this context, which is the
// transaction-scoped client while a transaction is active and the base client
// otherwise.
export function createTransactionContext(
    kysely: Kysely<any>,
): ITransactionContext<Kysely<any>> {
    return new TransactionContext<Kysely<any>>({
        token: contextToken("kysely"),
        adapter: new KyselyTransactionAdapter({
            database: kysely,
        }),
        executionContext,
    });
}
