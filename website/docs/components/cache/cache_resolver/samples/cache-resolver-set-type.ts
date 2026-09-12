import { cacheResolver } from "./cache-resolver-initial-config.js";

await cacheResolver
    .setType<string>()
    .use("redis")
    .add("user/jose@gmail.com", "some-string-value");
