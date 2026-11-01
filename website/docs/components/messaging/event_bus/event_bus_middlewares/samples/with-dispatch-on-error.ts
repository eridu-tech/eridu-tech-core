import { withDispatchOnErrorFactory } from "eridu-tech/event-bus/middlewares";
import { use } from "eridu-tech/middleware";
import { eventBusResolver } from "./event-bus.js";

const withDispatchOnError = withDispatchOnErrorFactory(eventBusResolver);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    throw new Error("boom");
};

// Wrap with an error dispatch using the default adapter (`memory`)
const wrappedCreateUser = use(
    createUser,
    withDispatchOnError({
        type: "user.error",
        payload: ({ args, error }) => ({
            userId: args[0],
            error,
        }),
    }),
);

// Wrap with an error dispatch using a specific adapter (`redis`)
const wrappedCreateUserOnRedis = use(
    createUser,
    withDispatchOnError.use("redis")({
        type: "user.error",
        payload: ({ args, error }) => ({
            userId: args[0],
            error,
        }),
    }),
);

try {
    await wrappedCreateUser("123");
} catch (error) {
    // The "user.error" event is dispatched with the caught error,
    // then the original error is re-thrown
}
