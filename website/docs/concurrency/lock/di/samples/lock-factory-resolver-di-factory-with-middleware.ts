import { withLockFactory } from "eridu-tech/lock/middlewares";
import { use } from "eridu-tech/middleware";
import { lockFactory } from "./lock-factory-resolver-di-factory.js";

const withLock = withLockFactory(lockFactory);

const processJob = async (jobId: string): Promise<void> => {
    // ... process the job
};

const safeProcess = use(
    processJob,
    withLock.use("storage2")({
        key: ([jobId]) => `job:${jobId}`,
    }),
);

await safeProcess("job-123");
