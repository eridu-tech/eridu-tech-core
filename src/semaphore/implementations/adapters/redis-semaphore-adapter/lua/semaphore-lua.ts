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
        -- @param slotId string
        -- @param limit number
        -- @param expiration number | nil
        -- @return 1 | 0
        acquire = function(key, slotId, limit, expiration)
            local currentState = semaphoreStorage.find(key)
            if currentState == nil then
                semaphoreStorage.create(key, limit)
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
            semaphoreStorage.updateExpiration(key)

            return 1
        end,

        -- @param key string
        -- @param slotId string
        -- @return 1 | 0
        release = function(key, slotId)
            local currentState = semaphoreStorage.find(key)
            if currentState == nil then
                return 0
            end

            local hasRemoved = semaphoreStorage.removeSlot(key, slotId)
            if not hasRemoved then
                return 0
            end

            semaphoreStorage.removeIfEmpty(key)
            semaphoreStorage.updateExpiration(key)

            return 1
        end,

        -- @param key string
        -- @return 1 | 0
        forceReleaseAll = function(key)
            local currentState = semaphoreStorage.find(key)
            if currentState == nil then
                return 0
            end

            semaphoreStorage.remove(key)

            return 1
        end,

        -- @param key string
        -- @param slotId string
        -- @param newExpiration number
        -- @return 1 | 0
        refresh = function(key, slotId, newExpiration)
            local currentState = semaphoreStorage.find(key)
            if currentState == nil then
                return 0
            end

            local expiration = semaphoreStorage.findSlot(key, slotId)
            if expiration == nil then
                return 0
            end

            local isUnexpireable = expiration == 0
            if isUnexpireable then
                return 0
            end

            semaphoreStorage.addSlot(key, slotId, newExpiration)
            semaphoreStorage.updateExpiration(key)

            return 1
        end,

        -- @param key string
        -- @return IRedisJsonSemaphoreState | nil
        getState = function(key)
            local currentState = semaphoreStorage.find(key)
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
