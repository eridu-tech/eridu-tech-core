import { withLogSpanFactory } from "eridu-tech/log/middlewares";
import { use } from "eridu-tech/middleware";
import { logResolver } from "./log-resolver.js";

const withLogSpan = withLogSpanFactory(logResolver);

const loadUser = async (userId: string): Promise<string> => `user-${userId}`;

// Wrap with a span using the default transport (`console`)
const wrappedLoadUser = use(loadUser, withLogSpan("user.load"));

// Wrap with a span using a specific transport (`no-op`)
const wrappedLoadUserSilently = use(
    loadUser,
    withLogSpan.use("no-op")("user.load"),
);
