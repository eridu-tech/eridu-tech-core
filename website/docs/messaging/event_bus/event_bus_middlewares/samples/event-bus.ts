import { EventBusResolver } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";

export const eventBusResolver = new EventBusResolver({
    adapters: {
        storage1: new MemoryEventBusAdapter(),
        storage2: new MemoryEventBusAdapter(),
    },
    defaultAdapter: "storage1",
});

await eventBusResolver.init();
