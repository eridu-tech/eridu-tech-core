import { withSyncLoggingFactory } from "eridu-tech/logger/middlewares";
import { use } from "eridu-tech/middleware";
import { loggerResolver } from "./logger-resolver.js";

const withSyncLogging = withSyncLoggingFactory(loggerResolver);

const parseConfig = (raw: string): string => raw.trim();

// Logs "class:", "function:", "args:" and "return:" with the default transport
const wrappedParseConfig = use(
    parseConfig,
    withSyncLogging({ className: "ConfigService" }),
);

// Reports failures at the "fatal" level instead of "error"
const wrappedParseConfigFatal = use(
    parseConfig,
    withSyncLogging({ className: "ConfigService", useFatalLevel: true }),
);

// Bound to a specific transport (`no-op`)
const wrappedParseConfigSilently = use(
    parseConfig,
    withSyncLogging.use("no-op")({ className: "ConfigService" }),
);
