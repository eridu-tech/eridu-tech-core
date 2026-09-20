import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { transactionContext } from "./transaction-context.js";

const eventBusAdapter = new MemoryEventBusAdapter({
    // Immediately outside a transaction, after commit inside transaction
    transactionHooks: transactionContext,
});
