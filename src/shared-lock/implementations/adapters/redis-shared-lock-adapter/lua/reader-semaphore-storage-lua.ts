/**
 * @module SharedLock
 */

/**
 * Mirrors the reader semaphore part of the `MemorySharedLockAdapter`: slot
 * expirations are stored as unix timestamps in milliseconds (`0` means the slot
 * never expires), expired slots are treated as missing and the TTL of the keys
 * is relative so it never depends on the Redis server clock.
 *
 * @internal
 */
export const readerSemaphoreStorageLua = `
-- @param currentDate number
local function ReaderSemaphoreStorage(currentDate)
    -- @param key string
    -- @return string
    local function getReaderKey(key)
        return key .. "__reader"
    end

    -- @param key string
    -- @return string
    local function getLimitKey(key)
        return getReaderKey(key) .. "__limit"
    end

    -- @param key string
    -- @return void
    local function removeExpiredSlots(key)
        redis.call("zremrangebyscore", getReaderKey(key), 1, currentDate)
    end

    -- @param key string
    -- @return number | nil
    local function findLimit(key)
        return tonumber(redis.call("get", getLimitKey(key)))
    end

    -- @param key string
    -- @return number
    local function countSlots(key)
        return tonumber(redis.call("zcard", getReaderKey(key)))
    end

    -- @param key string
    -- @return void
    local function updateExpiration(key)
        local readerKey = getReaderKey(key)
        local limitKey = getLimitKey(key)

        local hasUnexpireableSlot = tonumber(redis.call("zcount", readerKey, 0, 0)) > 0
        if hasUnexpireableSlot then
            redis.call("persist", readerKey)
            redis.call("persist", limitKey)
            return
        end

        local longestExpiration = tonumber(redis.call("zrange", readerKey, -1, -1, "WITHSCORES")[2])
        local hasExpireableSlot = longestExpiration ~= nil and longestExpiration > 0
        if not hasExpireableSlot then
            return
        end

        local timeToLive = math.ceil(longestExpiration - currentDate)
        if timeToLive <= 0 then
            redis.call("del", readerKey)
            redis.call("del", limitKey)
            return
        end

        redis.call("pexpire", readerKey, timeToLive)
        redis.call("pexpire", limitKey, timeToLive)
    end

    return {
        -- @param key string
        -- @return { limit number, slotCount number } | nil
        find = function(key)
            removeExpiredSlots(key)

            local slotCount = countSlots(key)
            if slotCount == 0 then
                return nil
            end

            local limit = findLimit(key)
            if limit == nil then
                return nil
            end

            return {
                limit = limit,
                slotCount = slotCount,
            }
        end,

        -- @param key string
        -- @param limit number
        -- @return void
        create = function(key, limit)
            redis.call("set", getLimitKey(key), limit)
        end,

        -- @param key string
        -- @return number
        countSlots = countSlots,

        -- @param key string
        -- @param slotId string
        -- @return number | nil
        findSlot = function(key, slotId)
            return tonumber(redis.call("zscore", getReaderKey(key), slotId))
        end,

        -- @param key string
        -- @return table<string, number>
        findSlots = function(key)
            local slots = {}

            local slotsArray = redis.call("zrange", getReaderKey(key), 0, -1, "WITHSCORES")
            for i = 1, #slotsArray, 2 do
                slots[slotsArray[i]] = tonumber(slotsArray[i + 1])
            end

            return slots
        end,

        -- @param key string
        -- @param slotId string
        -- @param expiration number | nil
        -- @return void
        addSlot = function(key, slotId, expiration)
            redis.call("zadd", getReaderKey(key), expiration or 0, slotId)
        end,

        -- @param key string
        -- @param slotId string
        -- @return boolean
        removeSlot = function(key, slotId)
            local removedCount = redis.call("zrem", getReaderKey(key), slotId)
            return removedCount == 1
        end,

        -- @param key string
        -- @return void
        removeIfEmpty = function(key)
            local slotCount = countSlots(key)
            if slotCount > 0 then
                return
            end

            redis.call("del", getReaderKey(key))
            redis.call("del", getLimitKey(key))
        end,

        -- @param key string
        -- @return void
        remove = function(key)
            redis.call("del", getReaderKey(key))
            redis.call("del", getLimitKey(key))
        end,

        -- @param key string
        -- @return void
        updateExpiration = updateExpiration,
    }
end
`;
