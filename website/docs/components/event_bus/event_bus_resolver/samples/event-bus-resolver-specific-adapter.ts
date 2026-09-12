import { eventBusResolver } from "./event-bus-resolver-initial-config.js";

await eventBusResolver.use("redis").dispatch("add", { a: 1, b: 2 });
