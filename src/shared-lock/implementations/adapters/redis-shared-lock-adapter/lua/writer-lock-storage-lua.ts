/**
 * @module SharedLock
 */

/**
 * Mirrors the writer lock part of the `MemorySharedLockAdapter`: the state is
 * stored together with its expiration as a unix timestamp in milliseconds
 * (`0` means the writer lock never expires), expired entries are treated as
 * missing and the key TTL is relative so it never depends on the Redis server
 * clock.
 *
 * @internal
 */
export const writerLockStorageLua = `
-- @param currentDate number
local function WriterLockStorage(currentDate)
    -- @param key string
    -- @return string
    local function getKey(key)
        return key .. "__writer"
    end

    -- @param key string
    -- @return IRedisJsonWriterLockState | nil
    local function find(key)
        local value = redis.call("get", getKey(key))
        if value == false or value == nil then
            return nil
        end

        local state = cjson.decode(value)
        local isExpirable = state.expiration ~= nil and state.expiration ~= 0
        if isExpirable and state.expiration <= currentDate then
            return nil
        end

        return state
    end

    -- @param key string
    -- @param state IRedisJsonWriterLockState
    -- @return void
    local function save(key, state)
        local expiration = state.expiration
        if expiration == nil or expiration == 0 then
            redis.call("set", getKey(key), cjson.encode(state))
            return
        end

        local timeToLive = math.ceil(expiration - currentDate)
        if timeToLive <= 0 then
            redis.call("del", getKey(key))
            return
        end

        redis.call("set", getKey(key), cjson.encode(state), "px", timeToLive)
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
            redis.call("del", getKey(key))
        end,
    }
end
`;
