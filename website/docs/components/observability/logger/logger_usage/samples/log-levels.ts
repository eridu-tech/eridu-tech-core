import { log } from "./log-initial-config.js";

log.debug(["Cache key resolved"]);
log.verbose(["Fetched upstream response"]);
log.info(["User signed in"]);
log.warn(["Retrying request"]);
log.error(["Payment failed"]);
log.fatal(["Database unavailable"]);