import { log } from "./proxy-log-resolver.js";

// Uses the transport registered under the "no-op" alias
log.use("no-op").info(["Sent to the no-op transport"]);
