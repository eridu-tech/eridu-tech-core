import { loggerResolver } from "./logger-resolver-initial-config.js";

// Uses the transport configured as the default (console)
loggerResolver.use().info(["Uses the default transport"]);
