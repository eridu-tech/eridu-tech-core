import { use, withOnError } from "eridu-tech/middleware";

interface User {
    id: string;
    name: string;
}

const reportFailure = async (name: string, error: unknown): Promise<void> => {
    console.error(`Failed to save user with name: ${name}`, error);
};

const saveUser = async (name: string): Promise<User> => {
    return { id: "1", name };
};

// The hook may be async and is awaited before the error is re-thrown.
const createUser = use(
    saveUser,
    withOnError<[name: string], User>(async ([name], error) => {
        await reportFailure(name, error);
    }),
);

// A synchronous hook is also supported, and is awaited before the error is re-thrown.
const createUserWithLogging = use(
    saveUser,
    withOnError<[name: string], User>(([name], error) => {
        console.error(`Failed to save user with name: ${name}`, error);
    }),
);
