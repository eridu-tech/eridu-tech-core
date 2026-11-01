import { withDispatchBeforeFactory } from "eridu-tech/event-bus/middlewares";
import { use } from "eridu-tech/middleware";
import { eventBusResolver } from "./event-bus.js";

const withDispatchBefore = withDispatchBeforeFactory(eventBusResolver);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with a "before" dispatch using the default adapter (`memory`)
const wrappedCreateUser = use(
    createUser,
    withDispatchBefore({
        type: "user.before.create",
        payload: ({ args }) => ({ userId: args[0] }),
    }),
);

// Wrap with a "before" dispatch using a specific adapter (`redis`)
const wrappedCreateUserOnRedis = use(
    createUser,
    withDispatchBefore.use("redis")({
        type: "user.before.create",
        payload: ({ args }) => ({ userId: args[0] }),
    }),
);

await wrappedCreateUser("123");
// The "user.before.create" event is dispatched before createUser runs
