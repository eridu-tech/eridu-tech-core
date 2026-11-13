import { logResolver } from "./log-resolver-initial-config.js";

// Uses the transport registered under the "no-op" alias
logResolver.use("no-op").info(["Uses the no-op transport"]);
