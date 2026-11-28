/**
 * @module Semaphore
 */

/**
 * Mirrors the `MemorySemaphoreAdapter` methods. Expiration arguments are unix
 * timestamps in milliseconds and `nil` means the slot never expires.
 *
 * @internal
 */
export const semaphoreLua = `
-- @param semaphoreStorage SemaphoreStorage
-- @return ISemaphoreAdapter
local function Semaphore(semaphoreStorage)
    return {
        -- @param key string
        -- @param limitKey string
        -- @param slotId string
        -- @param limit number
        -- @param expiration number | nil
        -- @return 1 | 0
        acquire = function(key, limitKey, slotId, limit, expiration)
            local currentState = semaphoreStorage.find(key, limitKey)
            if currentState == nil then
                semaphoreStorage.create(limitKey, limit)
                currentState = {
                    limit = limit,
                    slotCount = semaphoreStorage.countSlots(key),
                }
            end

            local isLimitReached = currentState.slotCount >= currentState.limit
            if isLimitReached then
                return 0
            end

            local hasSlotId = semaphoreStorage.findSlot(key, slotId) ~= nil
            if hasSlotId then
                return 1
            end

            semaphoreStorage.addSlot(key, slotId, expiration)
            semaphoreStorage.updateExpiration(key, limitKey)

            return 1
        end,

        -- @param key string
        -- @param limitKey string
        -- @param slotId string
        -- @return 1 | 0
        release = function(key, limitKey, slotId)
            local currentState = semaphoreStorage.find(key, limitKey)
            if currentState == nil then
                return 0
            end

            local hasRemoved = semaphoreStorage.removeSlot(key, slotId)
            if not hasRemoved then
                return 0
            end

            semaphoreStorage.removeIfEmpty(key, limitKey)
            semaphoreStorage.updateExpiration(key, limitKey)

            return 1
        end,

        -- @param key string
        -- @param limitKey string
        -- @return 1 | 0
        forceReleaseAll = function(key, limitKey)
            local currentState = semaphoreStorage.find(key, limitKey)
            if currentState == nil then
                return 0
            end

            semaphoreStorage.remove(key, limitKey)

            return 1
        end,

        -- @param key string
        -- @param limitKey string
        -- @param slotId string
        -- @param newExpiration number
        -- @return 1 | 0
        refresh = function(key, limitKey, slotId, newExpiration)
            local currentState = semaphoreStorage.find(key, limitKey)
            if currentState == nil then
                return 0
            end

            local expiration = semaphoreStorage.findSlot(key, slotId)
            if expiration == nil then
                return 0
            end

            local isUnexpireable = expiration == math.huge
            if isUnexpireable then
                return 0
            end

            semaphoreStorage.addSlot(key, slotId, newExpiration)
            semaphoreStorage.updateExpiration(key, limitKey)

            return 1
        end,

        -- @param key string
        -- @param limitKey string
        -- @return IRedisJsonSemaphoreState | nil
        getState = function(key, limitKey)
            local currentState = semaphoreStorage.find(key, limitKey)
            if currentState == nil then
                return nil
            end

            return {
                limit = currentState.limit,
                acquiredSlots = semaphoreStorage.findSlots(key),
            }
        end,
    }
end
`;
