import { cache } from "./cache-resolver-di-factory.js";

// Uses the storage2 adapter
await cache.use("storage2").add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
