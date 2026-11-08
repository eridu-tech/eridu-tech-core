import { logger } from "./logger-initial-config.js";

logger.debug("Cache key resolved", { key: "user/42" });
logger.verbose("Fetched upstream response", { status: 200 });
logger.info("User signed in", { userId: "42" });
logger.warn("Retrying request", { attempt: 2 });
logger.error("Payment failed", { orderId: "o-1" });
logger.fatal("Database unavailable");
