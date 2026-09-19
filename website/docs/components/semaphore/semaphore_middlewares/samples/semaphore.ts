import { SemaphoreFactory } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";

export const semaphoreFactory = new SemaphoreFactory({
    adapter: new MemorySemaphoreAdapter(),
});
