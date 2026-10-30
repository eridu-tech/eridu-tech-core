import { eventBus } from "./event-bus-resolver-di.js";

await eventBus.use("redis").dispatch("userCreated", { userId: "user-1" });
