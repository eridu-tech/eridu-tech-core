import { fileURLToPath } from "node:url";
import { withSyncMetadataFactory } from "eridu-tech/log/middlewares";
import { use } from "eridu-tech/middleware";
import { logResolver } from "./log-resolver.js";

const withSyncMetadata = withSyncMetadataFactory(logResolver);

const parseConfig = (raw: string): string => raw.trim();

// Scopes filePath, class and function metadata and uses the default transport
const wrappedParseConfig = use(
    parseConfig,
    withSyncMetadata({
        className: "ConfigService",
        getCurrentFilePath: () => fileURLToPath(import.meta.url),
        metadata: ({
            functionName,
            args,
        }: {
            functionName: string;
            args: [string];
        }) => ({
            functionName,
            rawLength: args[0].length,
        }),
    }),
);

// Bound to a specific transport (`no-op`)
const wrappedParseConfigSilently = use(
    parseConfig,
    withSyncMetadata.use("no-op")({ className: "ConfigService" }),
);
