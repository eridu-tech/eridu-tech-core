import { withLoggingFactory } from "eridu-tech/log/middlewares";
import { use } from "eridu-tech/middleware";
import { logResolver } from "./log-resolver.js";

const withLogging = withLoggingFactory(logResolver);

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
