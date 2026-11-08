import { fileURLToPath } from "node:url";
import { withMetadataFactory } from "eridu-tech/logger/middlewares";
import { use } from "eridu-tech/middleware";
import { loggerResolver } from "./logger-resolver.js";

const withMetadata = withMetadataFactory(loggerResolver);

const loadUser = async (userId: string): Promise<string> => `user-${userId}`;

// Scopes filePath, class and function metadata and uses the default transport
const wrappedLoadUser = use(
    loadUser,
    withMetadata({
        className: "UserService",
        getCurrentFilePath: () => fileURLToPath(import.meta.url),
        metadata: ({
            functionName,
            args,
        }: {
            functionName: string;
            args: [string];
        }) => ({
            functionName,
            userId: args[0],
        }),
    }),
);

// Bound to a specific transport (`no-op`)
const wrappedLoadUserSilently = use(
    loadUser,
    withMetadata.use("no-op")({ className: "UserService" }),
);
