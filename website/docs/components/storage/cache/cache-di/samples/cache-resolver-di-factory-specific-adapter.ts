import { cache } from "./cache-resolver-di-factory.js";

// Uses the Redis adapter
await cache.use("redis").add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
