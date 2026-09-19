import { withLockFactory } from "eridu-tech/lock/middlewares";
import { use } from "eridu-tech/middleware";
import { lockFactory } from "./lock.js";

const withLock = withLockFactory(lockFactory);

const processJob = async (jobId: string): Promise<void> => {
    // Critical section — only one process should execute this at a time
    // ... process the job
};

// Wrap with distributed lock
const safeProcess = use(
    processJob,
    withLock({
        key: ([jobId]) => `job:${jobId}`,
    }),
);

await safeProcess("job-123"); // Acquires lock, processes, releases lock
