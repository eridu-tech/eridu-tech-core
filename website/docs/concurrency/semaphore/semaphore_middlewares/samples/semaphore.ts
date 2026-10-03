import { SemaphoreFactoryResolver } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";

export const semaphoreFactoryResolver = new SemaphoreFactoryResolver({
    adapters: {
        storage1: new MemorySemaphoreAdapter(),
        storage2: new MemorySemaphoreAdapter(),
    },
    defaultAdapter: "storage1",
});
