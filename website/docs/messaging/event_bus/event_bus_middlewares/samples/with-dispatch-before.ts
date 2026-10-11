import { withDispatchBeforeFactory } from "eridu-tech/event-bus/middlewares";
import { use } from "eridu-tech/middleware";
import { eventBusResolver } from "./event-bus.js";

const withDispatchBefore = withDispatchBeforeFactory(eventBusResolver);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with a "before" dispatch
const wrappedCreateUser = use(
    createUser,
    withDispatchBefore.use("storage2")({
        type: "user.before.create",
        payload: ({ args }) => ({ userId: args[0] }),
    }),
);

await wrappedCreateUser("123");
// The "user.before.create" event is dispatched before createUser runs
