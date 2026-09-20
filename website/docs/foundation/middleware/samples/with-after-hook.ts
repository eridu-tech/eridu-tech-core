import { use, withAfterHook } from "eridu-tech/middleware";

interface User {
    id: string;
    name: string;
}

const saveUser = async (name: string): Promise<User> => {
    return { id: "1", name };
};

const trackUser = async (user: User): Promise<void> => {
    console.log(`Tracking user: ${user.id}`);
};

// The hook may be async and can replace the result by returning a value.
const createUser = use(
    saveUser,
    withAfterHook<[name: string], User>(async ([name], user) => {
        await trackUser(user);
        return { ...user, name: name.trim() };
    }),
);

// Returning nothing keeps the original result, which pairs with `detach` for
// fire-and-forget side effects that should not delay the caller.
const createUserWithSideEffect = use(
    saveUser,
    withAfterHook<[name: string], User>((_args, user) => {
        console.log(`Saved user: ${user.id}`);
    }, true),
);
