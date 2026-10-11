import { eventBus } from "./event-bus-resolver-di.js";

// Uses the adapter configured as the default (memory)
await eventBus.use().dispatch("userCreated", { userId: "user-1" });
