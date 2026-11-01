import { withSemaphoreFactory } from "eridu-tech/semaphore/middlewares";
import { use } from "eridu-tech/middleware";
import { semaphoreFactoryResolver } from "./semaphore.js";

const withSemaphore = withSemaphoreFactory(semaphoreFactoryResolver);

const processFile = async (filePath: string): Promise<void> => {
    // Process file — limited concurrency
    // ... process the file
};

// Wrap with semaphore using the default adapter (`memory`) — max 3 concurrent file processes
const throttledProcess = use(
    processFile,
    withSemaphore({
        key: ([filePath]) => `file-path:${filePath}`,
        limit: 3,
    }),
);

// Wrap with semaphore using a specific adapter (`redis`)
const throttledProcessOnRedis = use(
    processFile,
    withSemaphore.use("redis")({
        key: ([filePath]) => `file-path:${filePath}`,
        limit: 3,
    }),
);

// These will run up to 3 at a time
await Promise.all([
    throttledProcess("/data/file1.json"),
    throttledProcess("/data/file2.json"),
    throttledProcess("/data/file3.json"),
    throttledProcess("/data/file4.json"), // Waits for a slot
]);

await throttledProcessOnRedis("/data/redis-file.json");
