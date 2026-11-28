/**
 * @module SharedLock
 */

/**
 * Mirrors the `MemorySharedLockAdapter` methods. Expiration arguments are unix
 * timestamps in milliseconds and `nil` means the lock never expires.
 *
 * @internal
 */
export const sharedLockLua = `
-- @param writerLockStorage WriterLockStorage
-- @param readerSemaphoreStorage ReaderSemaphoreStorage
-- @return ISharedLockAdapter
local function SharedLock(writerLockStorage, readerSemaphoreStorage)
    -- @param key string
    -- @return boolean
    local function hasActiveWriter(key)
        return writerLockStorage.find(key) ~= nil
    end

    -- @param key string
    -- @return boolean
    local function hasActiveReader(key)
        return readerSemaphoreStorage.find(key) ~= nil
    end

    return {
        -- @param key string
        -- @param lockId string
        -- @param expiration number | nil
        -- @return 1 | 0
        acquireWriter = function(key, lockId, expiration)
            if hasActiveReader(key) then
                return 0
            end

            local currentWriter = writerLockStorage.find(key)
            local isAcquiredByDifferentOwner = currentWriter ~= nil and currentWriter.owner ~= lockId
            if isAcquiredByDifferentOwner then
                return 0
            end

            writerLockStorage.save(key, {
                owner = lockId,
                expiration = expiration or 0,
            })

            return 1
        end,

        -- @param key string
        -- @param lockId string
        -- @return 1 | 0
        releaseWriter = function(key, lockId)
            if hasActiveReader(key) then
                return 0
            end

            local currentWriter = writerLockStorage.find(key)
            if currentWriter == nil then
                return 0
            end

            if currentWriter.owner ~= lockId then
                return 0
            end

            writerLockStorage.remove(key)

            return 1
        end,

        -- @param key string
        -- @param lockId string
        -- @param expiration number
        -- @return 1 | 0
        refreshWriter = function(key, lockId, expiration)
            if hasActiveReader(key) then
                return 0
            end

            local currentWriter = writerLockStorage.find(key)
            if currentWriter == nil then
                return 0
            end

            if currentWriter.owner ~= lockId then
                return 0
            end

            local currentExpiration = currentWriter.expiration
            local isUnexpireable = currentExpiration == nil or currentExpiration == 0
            if isUnexpireable then
                return 0
            end

            writerLockStorage.save(key, {
                owner = currentWriter.owner,
                expiration = expiration,
            })

            return 1
        end,

        -- @param key string
        -- @param lockId string
        -- @param limit number
        -- @param expiration number | nil
        -- @return 1 | 0
        acquireReader = function(key, lockId, limit, expiration)
            if hasActiveWriter(key) then
                return 0
            end

            local currentReader = readerSemaphoreStorage.find(key)
            if currentReader == nil then
                readerSemaphoreStorage.create(key, limit)
                currentReader = {
                    limit = limit,
                    slotCount = readerSemaphoreStorage.countSlots(key),
                }
            end

            local isLimitReached = currentReader.slotCount >= currentReader.limit
            if isLimitReached then
                return 0
            end

            local hasSlotId = readerSemaphoreStorage.findSlot(key, lockId) ~= nil
            if hasSlotId then
                return 1
            end

            readerSemaphoreStorage.addSlot(key, lockId, expiration)
            readerSemaphoreStorage.updateExpiration(key)

            return 1
        end,

        -- @param key string
        -- @param lockId string
        -- @return 1 | 0
        releaseReader = function(key, lockId)
            if hasActiveWriter(key) then
                return 0
            end

            local currentReader = readerSemaphoreStorage.find(key)
            if currentReader == nil then
                return 0
            end

            local hasRemoved = readerSemaphoreStorage.removeSlot(key, lockId)
            if not hasRemoved then
                return 0
            end

            readerSemaphoreStorage.removeIfEmpty(key)
            readerSemaphoreStorage.updateExpiration(key)

            return 1
        end,

        -- @param key string
        -- @param lockId string
        -- @param newExpiration number
        -- @return 1 | 0
        refreshReader = function(key, lockId, newExpiration)
            if hasActiveWriter(key) then
                return 0
            end

            local currentReader = readerSemaphoreStorage.find(key)
            if currentReader == nil then
                return 0
            end

            local expiration = readerSemaphoreStorage.findSlot(key, lockId)
            if expiration == nil then
                return 0
            end

            local isUnexpireable = expiration == 0
            if isUnexpireable then
                return 0
            end

            readerSemaphoreStorage.addSlot(key, lockId, newExpiration)
            readerSemaphoreStorage.updateExpiration(key)

            return 1
        end,

        -- @param key string
        -- @return 1 | 0
        forceRelease = function(key)
            local hasSharedLock = hasActiveWriter(key) or hasActiveReader(key)

            writerLockStorage.remove(key)
            readerSemaphoreStorage.remove(key)

            if not hasSharedLock then
                return 0
            end

            return 1
        end,

        -- @param key string
        -- @return IRedisJsonSharedLockState | nil
        getState = function(key)
            local writer = writerLockStorage.find(key)
            local reader = readerSemaphoreStorage.find(key)
            if writer == nil and reader == nil then
                return nil
            end

            local state = {}
            if writer ~= nil then
                state.writer = {
                    owner = writer.owner,
                    expiration = writer.expiration,
                }
            end
            if reader ~= nil then
                state.reader = {
                    limit = reader.limit,
                    acquiredSlots = readerSemaphoreStorage.findSlots(key),
                }
            end

            return state
        end,
    }
end
`;
