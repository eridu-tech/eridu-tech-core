import { logger } from "./proxy-logger-resolver.js";

// Uses the transport registered under the "no-op" alias
logger.use("no-op").info(["Sent to the no-op transport"]);
