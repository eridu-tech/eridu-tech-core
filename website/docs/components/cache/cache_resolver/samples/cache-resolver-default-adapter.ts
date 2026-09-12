import { cacheResolver } from "./cache-resolver-initial-config.js";

await cacheResolver.use().add("user/jose@gmail.com", {
    name: "Jose",
    age: 20,
});
