import { withLockFactory } from "eridu-tech/lock/middlewares";
import { use } from "eridu-tech/middleware";
import { lockFactoryResolver } from "./lock.js";

const withLock = withLockFactory(lockFactoryResolver);

const processJob = async (jobId: string): Promise<void> => {
    // Critical section — only one process should execute this at a time
    // ... process the job
};

// Wrap with distributed lock using the default adapter (`storage1`)
const safeProcess = use(
    processJob,
    withLock({
        key: ([jobId]) => `job:${jobId}`,
    }),
);

// Wrap with distributed lock using a specific adapter (`storage2`)
const safeProcessOnStorage2 = use(
    processJob,
    withLock.use("storage2")({
        key: ([jobId]) => `job:${jobId}`,
    }),
);

await safeProcess("job-123"); // Acquires lock, processes, releases lock
await safeProcessOnStorage2("job-456"); // Uses the storage2 adapter
