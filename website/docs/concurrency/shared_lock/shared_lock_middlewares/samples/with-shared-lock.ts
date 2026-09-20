import {
    withSharedLockFactory,
    SHARED_LOCK_WHEN,
} from "eridu-tech/shared-lock/middlewares";
import { use } from "eridu-tech/middleware";
import { sharedLockFactory } from "./shared-lock.js";

const withSharedLock = withSharedLockFactory(sharedLockFactory);

const readData = async (key: string): Promise<unknown> => {
    // Safe to run concurrently with other readers
    return { data: "..." };
};

// Wrap with shared-lock in reader mode — multiple readers allowed
const safeRead = use(
    readData,
    withSharedLock({
        key: ([resourceKey]) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.READER,
        limit: 10, // Up to 10 concurrent readers
    }),
);

const writeData = async (key: string): Promise<void> => {
    // Safe to run concurrently as only writer
};

// Wrap with shared-lock in writer mode — only writer allowed
const safeWrite = use(
    writeData,
    withSharedLock({
        key: ([resourceKey]) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.WRITER,
        limit: 10,
    }),
);

await writeData("config");
