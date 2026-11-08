import { loggerResolver } from "./logger-resolver-initial-config.js";

// Uses the transport registered under the "no-op" alias
loggerResolver.use("no-op").info("Uses the no-op transport");
