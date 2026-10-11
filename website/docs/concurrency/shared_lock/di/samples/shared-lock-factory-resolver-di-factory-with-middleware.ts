import { use } from "eridu-tech/middleware";
import {
    SHARED_LOCK_WHEN,
    withSharedLockFactory,
} from "eridu-tech/shared-lock/middlewares";
import { sharedLockFactory } from "./shared-lock-factory-resolver-di-factory.js";

const withSharedLock = withSharedLockFactory(sharedLockFactory);

const readData = async (key: string): Promise<unknown> => {
    // Safe to run concurrently with other readers
    return { data: "..." };
};

const safeRead = use(
    readData,
    withSharedLock.use("storage2")({
        key: ([resourceKey]) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.READER,
        limit: 10,
    }),
);

await safeRead("config");
