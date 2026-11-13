import { withSyncLogSpanFactory } from "eridu-tech/log/middlewares";
import { use } from "eridu-tech/middleware";
import { logResolver } from "./log-resolver.js";

const withSyncLogSpan = withSyncLogSpanFactory(logResolver);

const parseConfig = (raw: string): string => raw.trim();

// Wrap with a span using the default transport (`console`)
const wrappedParseConfig = use(parseConfig, withSyncLogSpan("config.parse"));

// Wrap with a span using a specific transport (`no-op`)
const wrappedParseConfigSilently = use(
    parseConfig,
    withSyncLogSpan.use("no-op")("config.parse"),
);
