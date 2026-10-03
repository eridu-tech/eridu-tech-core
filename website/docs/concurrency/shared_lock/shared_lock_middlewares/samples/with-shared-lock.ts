import {
    withSharedLockFactory,
    SHARED_LOCK_WHEN,
} from "eridu-tech/shared-lock/middlewares";
import { use } from "eridu-tech/middleware";
import { sharedLockFactoryResolver } from "./shared-lock.js";

const withSharedLock = withSharedLockFactory(sharedLockFactoryResolver);

const readData = async (key: string): Promise<unknown> => {
    // Safe to run concurrently with other readers
    return { data: "..." };
};

// Wrap with shared-lock in reader mode using the default adapter (`storage1`) — multiple readers allowed
const safeRead = use(
    readData,
    withSharedLock({
        key: ([resourceKey]) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.READER,
        limit: 10, // Up to 10 concurrent readers
    }),
);

// Wrap with shared-lock in reader mode using a specific adapter (`storage2`)
const safeReadOnStorage2 = use(
    readData,
    withSharedLock.use("storage2")({
        key: ([resourceKey]) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.READER,
        limit: 10,
    }),
);

const writeData = async (key: string): Promise<void> => {
    // Safe to run concurrently as only writer
};

// Wrap with shared-lock in writer mode using the default adapter (`storage1`) — only writer allowed
const safeWrite = use(
    writeData,
    withSharedLock({
        key: ([resourceKey]) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.WRITER,
        limit: 10,
    }),
);

// Wrap with shared-lock in writer mode using a specific adapter (`storage2`)
const safeWriteOnStorage2 = use(
    writeData,
    withSharedLock.use("storage2")({
        key: ([resourceKey]) => `data:${resourceKey}`,
        when: SHARED_LOCK_WHEN.WRITER,
        limit: 10,
    }),
);

await writeData("config");
