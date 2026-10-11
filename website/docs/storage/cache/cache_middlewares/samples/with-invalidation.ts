import { withInvalidationFactory } from "eridu-tech/cache/middlewares";
import { use } from "eridu-tech/middleware";
import { cacheResolver } from "./cache.js";

const withInvalidation = withInvalidationFactory(cacheResolver);

const updateUser = async (userId: string, name: string): Promise<void> => {
    await fetch(`/api/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
    });
};

// Wrap with invalidation
const invalidatingUpdateUser = use(
    updateUser,
    withInvalidation.use("storage2")({
        key: ([userId]) => `user:${userId}`,
    }),
);

await invalidatingUpdateUser("123", "John");
// The "user:123" cache entry is removed after updateUser runs
