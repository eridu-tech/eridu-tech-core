/**
 * @module Semaphore
 */
import { semaphoreLua } from "@/semaphore/implementations/adapters/redis-semaphore-adapter/lua/semaphore-lua.js";
import { semaphoreStorageLua } from "@/semaphore/implementations/adapters/redis-semaphore-adapter/lua/semaphore-storage-lua.js";

/**
 * @internal
 */
export const semaphoreFactoryLua = `
${semaphoreStorageLua}
${semaphoreLua}

-- Mirrors the MemorySemaphoreAdapter constructor.
-- @param currentDate number
-- @return ISemaphoreAdapter
local function semaphoreFactory(currentDate)
    return Semaphore(SemaphoreStorage(currentDate))
end
`;
