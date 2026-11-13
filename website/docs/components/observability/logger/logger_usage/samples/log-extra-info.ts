import { log } from "./log-initial-config.js";

// Group and metadata for a single entry, without opening a scope
log.info(["User signed in"], {
    group: "auth",
    metadata: { userId: "42" },
});

// Failure levels also accept error details
log.error(["Payment failed"], {
    metadata: { orderId: "o-1" },
    error: { reason: "card_declined" },
});
