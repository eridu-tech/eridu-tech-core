import { logger } from "./logger-initial-config.js";

// Group and metadata for a single entry, without opening a scope
logger.info(["User signed in"], {
    group: "auth",
    metadata: { userId: "42" },
});

// Failure levels also accept error details
logger.error(["Payment failed"], {
    metadata: { orderId: "o-1" },
    errors: { reason: "card_declined" },
});
