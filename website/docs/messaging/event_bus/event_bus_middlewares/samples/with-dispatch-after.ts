import { withDispatchAfterFactory } from "eridu-tech/event-bus/middlewares";
import { use } from "eridu-tech/middleware";
import { eventBus } from "./event-bus.js";

const withDispatchAfter = withDispatchAfterFactory(eventBus);

const createUser = async (userId: string): Promise<string> => {
    // ... create the user
    return `user-${userId}`;
};

// Wrap with an "after" dispatch
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

const name = await wrappedCreateUser("123");
// The "user.after.create" event is dispatched after createUser resolves,
// with the return value included in the payload
