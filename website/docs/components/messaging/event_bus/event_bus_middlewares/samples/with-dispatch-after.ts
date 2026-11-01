import { withDispatchAfterFactory } from "eridu-tech/event-bus/middlewares";
import { use } from "eridu-tech/middleware";
import { eventBusResolver } from "./event-bus.js";

const withDispatchAfter = withDispatchAfterFactory(eventBusResolver);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with an "after" dispatch using the default adapter (`memory`)
const wrappedCreateUser = use(
    createUser,
    withDispatchAfter({
        type: "user.after.create",
        payload: ({ args, returnValue }) => ({
            userId: args[0],
            name: returnValue,
        }),
    }),
);

// Wrap with an "after" dispatch using a specific adapter (`redis`)
const wrappedCreateUserOnRedis = use(
    createUser,
    withDispatchAfter.use("redis")({
        type: "user.after.create",
        payload: ({ args, returnValue }) => ({
            userId: args[0],
            name: returnValue,
        }),
    }),
);

const name = await wrappedCreateUser("123");
// The "user.after.create" event is dispatched after createUser resolves,
// with the return value included in the payload
