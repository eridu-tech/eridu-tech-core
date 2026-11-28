/**
 * @module SharedLock
 */

/**
 * Mirrors the writer lock part of the `MemorySharedLockAdapter`: the state is
 * stored together with its expiration as a unix timestamp in milliseconds,
 * expired entries are treated as missing and the key TTL is relative so it
 * never depends on the Redis server clock. Writer locks without an expiration
 * omit the field and never get a key TTL.
 *
 * @internal
 */
export const writerLockStorageLua = `
-- @param currentDate number
local function WriterLockStorage(currentDate)
    -- @param key string
    -- @return IRedisJsonWriterLockState | nil
    local function find(key)
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
    -- @param state IRedisJsonWriterLockState
    -- @return void
    local function save(key, state)
        local expiration = state.expiration
        if expiration == nil then
            redis.call("set", key, cjson.encode(state))
            return
        end

        local timeToLive = math.ceil(expiration - currentDate)
        if timeToLive <= 0 then
            redis.call("del", key)
            return
        end

        redis.call("set", key, cjson.encode(state), "px", timeToLive)
    end

    return {
        -- @param key string
        -- @return IRedisJsonWriterLockState | nil
        find = find,

        -- @param key string
        -- @param state IRedisJsonWriterLockState
        -- @return void
        save = save,

        -- @param key string
        -- @return void
        remove = function(key)
            redis.call("del", key)
        end,
    }
end
`;
