import { logger } from "./proxy-logger-resolver.js";

// Uses the transport configured as the default (console)
logger.info("Resolved from the container on every call");
