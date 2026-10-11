import { use } from "eridu-tech/middleware";
import { withSemaphoreFactory } from "eridu-tech/semaphore/middlewares";
import { semaphoreFactory } from "./semaphore-factory-resolver-di-factory.js";

const withSemaphore = withSemaphoreFactory(semaphoreFactory);

const processFile = async (filePath: string): Promise<void> => {
    // ... process the file
};

const throttledProcess = use(
    processFile,
    withSemaphore.use("storage2")({
        key: ([filePath]) => `file-path:${filePath}`,
        limit: 3,
    }),
);

await throttledProcess("/data/file.json");
