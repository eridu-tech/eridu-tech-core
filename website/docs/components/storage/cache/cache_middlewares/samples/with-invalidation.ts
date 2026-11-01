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

// Wrap with invalidation using the default adapter (`memory`)
const invalidatingUpdateUser = use(
    updateUser,
    withInvalidation({
        key: ([userId]) => `user:${userId}`,
    }),
);

// Wrap with invalidation using a specific adapter (`redis`)
const invalidatingUpdateUserOnRedis = use(
    updateUser,
    withInvalidation.use("redis")({
        key: ([userId]) => `user:${userId}`,
    }),
);

await invalidatingUpdateUser("123", "John");
// The "user:123" cache entry is removed after updateUser runs

await invalidatingUpdateUserOnRedis("456", "Jane");
// The "user:456" cache entry is removed from the Redis adapter
