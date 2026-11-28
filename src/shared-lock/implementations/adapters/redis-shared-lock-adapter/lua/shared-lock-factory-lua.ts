/**
 * @module SharedLock
 */
import { readerSemaphoreStorageLua } from "@/shared-lock/implementations/adapters/redis-shared-lock-adapter/lua/reader-semaphore-storage-lua.js";
import { sharedLockLua } from "@/shared-lock/implementations/adapters/redis-shared-lock-adapter/lua/shared-lock-lua.js";
import { writerLockStorageLua } from "@/shared-lock/implementations/adapters/redis-shared-lock-adapter/lua/writer-lock-storage-lua.js";

/**
 * @internal
 */
export const sharedLockFactoryLua = `
${writerLockStorageLua}
${readerSemaphoreStorageLua}
${sharedLockLua}

-- Mirrors the MemorySharedLockAdapter constructor.
-- @param currentDate number
-- @return ISharedLockAdapter
local function sharedLockFactory(currentDate)
    return SharedLock(
        WriterLockStorage(currentDate),
        ReaderSemaphoreStorage(currentDate)
    )
end
`;
