import { eventBusResolver } from "./event-bus-resolver-initial-config.js";

await eventBusResolver.use().dispatch("add", { a: 1, b: 2 });
