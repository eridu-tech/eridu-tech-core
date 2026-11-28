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
    -- @param writerKey string
    -- @return boolean
    local function hasActiveWriter(writerKey)
        return writerLockStorage.find(writerKey) ~= nil
    end

    -- @param readerKey string
    -- @param readerLimitKey string
    -- @return boolean
    local function hasActiveReader(readerKey, readerLimitKey)
        return readerSemaphoreStorage.find(readerKey, readerLimitKey) ~= nil
    end

    return {
        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @param lockId string
        -- @param expiration number | nil
        -- @return 1 | 0
        acquireWriter = function(writerKey, readerKey, readerLimitKey, lockId, expiration)
            if hasActiveReader(readerKey, readerLimitKey) then
                return 0
            end

            local currentWriter = writerLockStorage.find(writerKey)
            local isAcquiredByDifferentOwner = currentWriter ~= nil and currentWriter.owner ~= lockId
            if isAcquiredByDifferentOwner then
                return 0
            end

            writerLockStorage.save(writerKey, {
                owner = lockId,
                expiration = expiration,
            })

            return 1
        end,

        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @param lockId string
        -- @return 1 | 0
        releaseWriter = function(writerKey, readerKey, readerLimitKey, lockId)
            if hasActiveReader(readerKey, readerLimitKey) then
                return 0
            end

            local currentWriter = writerLockStorage.find(writerKey)
            if currentWriter == nil then
                return 0
            end

            if currentWriter.owner ~= lockId then
                return 0
            end

            writerLockStorage.remove(writerKey)

            return 1
        end,

        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @param lockId string
        -- @param expiration number
        -- @return 1 | 0
        refreshWriter = function(writerKey, readerKey, readerLimitKey, lockId, expiration)
            if hasActiveReader(readerKey, readerLimitKey) then
                return 0
            end

            local currentWriter = writerLockStorage.find(writerKey)
            if currentWriter == nil then
                return 0
            end

            if currentWriter.owner ~= lockId then
                return 0
            end

            local currentExpiration = currentWriter.expiration
            local isUnexpireable = currentExpiration == nil
            if isUnexpireable then
                return 0
            end

            writerLockStorage.save(writerKey, {
                owner = currentWriter.owner,
                expiration = expiration,
            })

            return 1
        end,

        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @param lockId string
        -- @param limit number
        -- @param expiration number | nil
        -- @return 1 | 0
        acquireReader = function(writerKey, readerKey, readerLimitKey, lockId, limit, expiration)
            if hasActiveWriter(writerKey) then
                return 0
            end

            local currentReader = readerSemaphoreStorage.find(readerKey, readerLimitKey)
            if currentReader == nil then
                readerSemaphoreStorage.create(readerLimitKey, limit)
                currentReader = {
                    limit = limit,
                    slotCount = readerSemaphoreStorage.countSlots(readerKey),
                }
            end

            local isLimitReached = currentReader.slotCount >= currentReader.limit
            if isLimitReached then
                return 0
            end

            local hasSlotId = readerSemaphoreStorage.findSlot(readerKey, lockId) ~= nil
            if hasSlotId then
                return 1
            end

            readerSemaphoreStorage.addSlot(readerKey, lockId, expiration)
            readerSemaphoreStorage.updateExpiration(readerKey, readerLimitKey)

            return 1
        end,

        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @param lockId string
        -- @return 1 | 0
        releaseReader = function(writerKey, readerKey, readerLimitKey, lockId)
            if hasActiveWriter(writerKey) then
                return 0
            end

            local currentReader = readerSemaphoreStorage.find(readerKey, readerLimitKey)
            if currentReader == nil then
                return 0
            end

            local hasRemoved = readerSemaphoreStorage.removeSlot(readerKey, lockId)
            if not hasRemoved then
                return 0
            end

            readerSemaphoreStorage.removeIfEmpty(readerKey, readerLimitKey)
            readerSemaphoreStorage.updateExpiration(readerKey, readerLimitKey)

            return 1
        end,

        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @param lockId string
        -- @param newExpiration number
        -- @return 1 | 0
        refreshReader = function(writerKey, readerKey, readerLimitKey, lockId, newExpiration)
            if hasActiveWriter(writerKey) then
                return 0
            end

            local currentReader = readerSemaphoreStorage.find(readerKey, readerLimitKey)
            if currentReader == nil then
                return 0
            end

            local expiration = readerSemaphoreStorage.findSlot(readerKey, lockId)
            if expiration == nil then
                return 0
            end

            local isUnexpireable = expiration == math.huge
            if isUnexpireable then
                return 0
            end

            readerSemaphoreStorage.addSlot(readerKey, lockId, newExpiration)
            readerSemaphoreStorage.updateExpiration(readerKey, readerLimitKey)

            return 1
        end,

        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @return 1 | 0
        forceRelease = function(writerKey, readerKey, readerLimitKey)
            local hasSharedLock = hasActiveWriter(writerKey) or hasActiveReader(readerKey, readerLimitKey)

            writerLockStorage.remove(writerKey)
            readerSemaphoreStorage.remove(readerKey, readerLimitKey)

            if not hasSharedLock then
                return 0
            end

            return 1
        end,

        -- @param writerKey string
        -- @param readerKey string
        -- @param readerLimitKey string
        -- @return IRedisJsonSharedLockState | nil
        getState = function(writerKey, readerKey, readerLimitKey)
            local writer = writerLockStorage.find(writerKey)
            local reader = readerSemaphoreStorage.find(readerKey, readerLimitKey)
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
                    acquiredSlots = readerSemaphoreStorage.findSlots(readerKey),
                }
            end

            return state
        end,
    }
end
`;
