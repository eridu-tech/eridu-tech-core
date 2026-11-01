import {
    AbortTransactionError,
    CommitTransactionError,
    MandatoryPropagationError,
    NeverPropagationError,
    StartTransactionError,
} from "eridu-tech/transaction-context/contracts";
import { transactionContext } from "./transaction-context-initial-config.js";

try {
    await transactionContext.run(async () => {
        // ...
    });
} catch (error: unknown) {
    if (error instanceof StartTransactionError) {
        // The adapter failed to start a transaction
    } else if (error instanceof CommitTransactionError) {
        // The transaction failed to commit
    } else if (error instanceof AbortTransactionError) {
        // The transaction failed to abort
    } else if (error instanceof MandatoryPropagationError) {
        // MANDATORY propagation was requested without an active transaction
    } else if (error instanceof NeverPropagationError) {
        // NEVER propagation was requested while a transaction was active
    } else {
        throw error;
    }
}
