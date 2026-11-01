import { use, withBeforeHook } from "eridu-tech/middleware";

interface User {
    id: string;
    name: string;
}

const saveUser = async (name: string): Promise<User> => {
    return { id: "1", name };
};

const auditName = async (name: string): Promise<void> => {
    console.log(`Saving user with name: ${name}`);
};

// The hook may be async and can replace the arguments of the wrapped function.
const createUser = use(
    saveUser,
    withBeforeHook<[name: string], User>(async ([name]) => {
        await auditName(name);
        return [name.trim()];
    }),
);

// With `detach` set to `true` the hook is fired without being awaited and its
// return value is ignored, so the wrapped function keeps the original arguments.
const createUserDetached = use(
    saveUser,
    withBeforeHook<[name: string], User>(async ([name]) => {
        await auditName(name);
    }, true),
);
