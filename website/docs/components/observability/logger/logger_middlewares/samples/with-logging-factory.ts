import { withLoggingFactory } from "eridu-tech/logger/middlewares";
import { use } from "eridu-tech/middleware";
import { loggerResolver } from "./logger-resolver.js";

const withLogging = withLoggingFactory(loggerResolver);

const createUser = async (name: string): Promise<string> => `user-${name}`;

// Logs "class:", "function:", "args:" and "return:" with the default transport
const wrappedCreateUser = use(
    createUser,
    withLogging({ className: "UserService" }),
);

// Reports failures at the "fatal" level instead of "error"
const wrappedCreateUserFatal = use(
    createUser,
    withLogging({ className: "UserService", useFatalLevel: true }),
);

// Bound to a specific transport (`no-op`)
const wrappedCreateUserSilently = use(
    createUser,
    withLogging.use("no-op")({ className: "UserService" }),
);
