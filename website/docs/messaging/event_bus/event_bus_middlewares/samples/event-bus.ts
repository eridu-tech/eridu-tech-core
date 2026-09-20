import { EventBus } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";

export const eventBus = new EventBus({
    adapter: new MemoryEventBusAdapter(),
});
