import { withCacheFactory } from "eridu-tech/cache/middlewares";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";
import { cache } from "./cache-resolver-di-factory.js";

const withCache = withCacheFactory(cache);

const fetchUser = async (userId: string): Promise<{ name: string }> => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
};

const cachedFetchUser = use(
    fetchUser,
    withCache.use("storage2")({
        key: ([userId]) => `user:${userId}`,
        ttl: TimeSpan.fromMinutes(10),
    }),
);

await cachedFetchUser("123");
