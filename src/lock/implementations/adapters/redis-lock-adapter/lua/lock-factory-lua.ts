/**
 * @module Lock
 */
import { lockLua } from "@/lock/implementations/adapters/redis-lock-adapter/lua/lock-lua.js";
import { lockStorageLua } from "@/lock/implementations/adapters/redis-lock-adapter/lua/lock-storage-lua.js";

/**
 * @internal
 */
export const lockFactoryLua = `
${lockStorageLua}
${lockLua}

-- Mirrors the MemoryLockAdapter constructor.
-- @param currentDate number
-- @return ILockAdapter
local function lockFactory(currentDate)
    return Lock(LockStorage(currentDate))
end
`;
