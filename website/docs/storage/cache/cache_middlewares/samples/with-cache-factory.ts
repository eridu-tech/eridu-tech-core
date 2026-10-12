import { withCacheFactory } from "eridu-tech/cache/middlewares";
import { use } from "eridu-tech/middleware";
import { TimeSpan } from "eridu-tech/time-span";
import { cacheResolver } from "./cache.js";

const withCache = withCacheFactory(cacheResolver);

const fetchUser = async (userId: string): Promise<{ name: string }> => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
};

// Wrap with caching using the default adapter (`memory`)
const cachedFetchUser = use(
    fetchUser,
    withCache({
        key: ([userId]) => `user:${userId}`,
        ttl: TimeSpan.fromMinutes(10), // Cache for 10 minutes
    }),
);

// Wrap with caching using a specific adapter (`redis`)
const cachedFetchUserOnRedis = use(
    fetchUser,
    withCache.use("redis")({
        key: ([userId]) => `user:${userId}`,
        ttl: TimeSpan.fromMinutes(10),
    }),
);

const user = await cachedFetchUser("123"); // Cache miss — fetches and caches
const userAgain = await cachedFetchUser("123"); // Cache hit — returns immediately
const userOnRedis = await cachedFetchUserOnRedis("123"); // Uses the Redis adapter
