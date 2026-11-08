import { withSyncLogSpanFactory } from "eridu-tech/logger/middlewares";
import { use } from "eridu-tech/middleware";
import { loggerResolver } from "./logger-resolver.js";

const withSyncLogSpan = withSyncLogSpanFactory(loggerResolver);

const parseConfig = (raw: string): string => raw.trim();

// Wrap with a span using the default transport (`console`)
const wrappedParseConfig = use(parseConfig, withSyncLogSpan("config.parse"));

// Wrap with a span using a specific transport (`no-op`)
const wrappedParseConfigSilently = use(
    parseConfig,
    withSyncLogSpan.use("no-op")("config.parse"),
);
