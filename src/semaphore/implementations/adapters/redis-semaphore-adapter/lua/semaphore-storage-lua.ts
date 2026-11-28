/**
 * @module Semaphore
 */

/**
 * Mirrors the `MemorySemaphoreAdapter` storage: slot expirations are stored as
 * unix timestamps in milliseconds (`+inf` means the slot never expires),
 * expired slots are treated as missing and the TTL of the keys is relative so
 * it never depends on the Redis server clock.
 *
 * @internal
 */
export const semaphoreStorageLua = `
-- @param currentDate number
local function SemaphoreStorage(currentDate)
    -- @param key string
    -- @return void
    local function removeExpiredSlots(key)
        redis.call("zremrangebyscore", key, 1, currentDate)
    end

    -- @param limitKey string
    -- @return number | nil
    local function findLimit(limitKey)
        return tonumber(redis.call("get", limitKey))
    end

    -- @param key string
    -- @return number
    local function countSlots(key)
        return tonumber(redis.call("zcard", key))
    end

    -- @param key string
    -- @param limitKey string
    -- @return void
    local function updateExpiration(key, limitKey)
        local highestScore = redis.call("zrange", key, -1, -1, "WITHSCORES")[2]
        if highestScore == nil then
            return
        end

        local longestExpiration = tonumber(highestScore)
        local hasUnexpireableSlot = longestExpiration == math.huge
        if hasUnexpireableSlot then
            redis.call("persist", key)
            redis.call("persist", limitKey)
            return
        end

        local timeToLive = math.ceil(longestExpiration - currentDate)
        if timeToLive <= 0 then
            redis.call("del", key)
            redis.call("del", limitKey)
            return
        end

        redis.call("pexpire", key, timeToLive)
        redis.call("pexpire", limitKey, timeToLive)
    end

    return {
        -- @param key string
        -- @param limitKey string
        -- @return { limit number, slotCount number } | nil
        find = function(key, limitKey)
            removeExpiredSlots(key)

            local slotCount = countSlots(key)
            if slotCount == 0 then
                return nil
            end

            local limit = findLimit(limitKey)
            if limit == nil then
                return nil
            end

            return {
                limit = limit,
                slotCount = slotCount,
            }
        end,

        -- @param limitKey string
        -- @param limit number
        -- @return void
        create = function(limitKey, limit)
            redis.call("set", limitKey, limit)
        end,

        -- @param key string
        -- @return number
        countSlots = countSlots,

        -- @param key string
        -- @param slotId string
        -- @return number | nil
        findSlot = function(key, slotId)
            local score = redis.call("zscore", key, slotId)
            if score == false or score == nil then
                return nil
            end

            return tonumber(score)
        end,

        -- @param key string
        -- @return table<string, number | null>
        findSlots = function(key)
            local slots = {}

            local slotsArray = redis.call("zrange", key, 0, -1, "WITHSCORES")
            for i = 1, #slotsArray, 2 do
                local expiration = tonumber(slotsArray[i + 1])
                if expiration == math.huge then
                    slots[slotsArray[i]] = cjson.null
                else
                    slots[slotsArray[i]] = expiration
                end
            end

            return slots
        end,

        -- @param key string
        -- @param slotId string
        -- @param expiration number | nil
        -- @return void
        addSlot = function(key, slotId, expiration)
            redis.call("zadd", key, expiration or "+inf", slotId)
        end,

        -- @param key string
        -- @param slotId string
        -- @return boolean
        removeSlot = function(key, slotId)
            local removedCount = redis.call("zrem", key, slotId)
            return removedCount == 1
        end,

        -- @param key string
        -- @param limitKey string
        -- @return void
        removeIfEmpty = function(key, limitKey)
            local slotCount = countSlots(key)
            if slotCount > 0 then
                return
            end

            redis.call("del", key)
            redis.call("del", limitKey)
        end,

        -- @param key string
        -- @param limitKey string
        -- @return void
        remove = function(key, limitKey)
            redis.call("del", key)
            redis.call("del", limitKey)
        end,

        -- @param key string
        -- @param limitKey string
        -- @return void
        updateExpiration = updateExpiration,
    }
end
`;
