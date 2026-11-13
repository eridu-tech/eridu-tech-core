import { logResolver } from "./log-resolver-initial-config.js";

// Uses the transport configured as the default (console)
logResolver.use().info(["Uses the default transport"]);
