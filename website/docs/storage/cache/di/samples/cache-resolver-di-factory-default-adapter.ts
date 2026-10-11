import { cache } from "./cache-resolver-di-factory.js";

// Uses the adapter configured as the default (storage1)
await cache.add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
