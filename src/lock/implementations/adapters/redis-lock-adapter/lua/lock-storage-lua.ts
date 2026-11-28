/**
 * @module Lock
 */

/**
 * Mirrors the `MemoryLockAdapter` storage: the lock state is stored together
 * with its expiration as a unix timestamp in milliseconds, expired entries are
 * treated as missing and the key TTL is relative so it never depends on the
 * Redis server clock. Locks without an expiration omit the field and never get
 * a key TTL.
 *
 * @internal
 */
export const lockStorageLua = `
-- @param currentDate number
local function LockStorage(currentDate)
    -- @param key string
    -- @return IRedisJsonLockState | nil
    local function findState(key)
        local value = redis.call("get", key)
        if value == false or value == nil then
            return nil
        end

        local state = cjson.decode(value)
        if state.expiration ~= nil and state.expiration <= currentDate then
            return nil
        end

        return state
    end

    -- @param key string
    -- @param state IRedisJsonLockState
    -- @return void
    local function saveState(key, state)
        if state.expiration == nil then
            redis.call("set", key, cjson.encode(state))
            return
        end

        local timeToLive = math.ceil(state.expiration - currentDate)
        if timeToLive <= 0 then
            redis.call("del", key)
            return
        end

        redis.call("set", key, cjson.encode(state), "px", timeToLive)
    end

    return {
        -- @param key string
        -- @return IRedisJsonLockState | nil
        find = findState,

        -- @param key string
        -- @param state IRedisJsonLockState
        -- @return void
        save = saveState,

        -- @param key string
        -- @return void
        remove = function(key)
            redis.call("del", key)
        end,
    }
end
`;
