import { eventBus } from "./event-bus-initial-config.js";

await eventBus.addListener("add", (event) => {
    console.log(event);
});

await eventBus.dispatch("add", {
    a: 5,
    b: 5,
});
