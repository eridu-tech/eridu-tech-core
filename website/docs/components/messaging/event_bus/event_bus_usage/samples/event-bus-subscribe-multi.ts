import { eventBus } from "./event-bus-initial-config.js";

const unsubscribe = await eventBus.subscribe(["add", "remove"], (event) => {
    console.log("EVENT:", event);
});

await eventBus.dispatch("add", { a: 1, b: 2 });
await eventBus.dispatch("remove", { id: 42 });

// Unsubscribes from both "add" and "remove" in one call
await unsubscribe();
