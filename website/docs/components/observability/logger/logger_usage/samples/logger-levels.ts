import { logger } from "./logger-initial-config.js";

logger.debug(["Cache key resolved"]);
logger.verbose(["Fetched upstream response"]);
logger.info(["User signed in"]);
logger.warn(["Retrying request"]);
logger.error(["Payment failed"]);
logger.fatal(["Database unavailable"]);