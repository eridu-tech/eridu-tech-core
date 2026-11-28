/**
 * @module Lock
 */

/**
 * Mirrors the `MemoryLockAdapter` methods. Expiration arguments are unix
 * timestamps in milliseconds and `nil` means the lock never expires.
 *
 * @internal
 */
export const lockLua = `
-- @param lockStorage LockStorage
-- @return ILockAdapter
local function Lock(lockStorage)
    return {
        -- @param key string
        -- @param lockId string
        -- @param expiration number | nil
        -- @return 1 | 0
        acquire = function(key, lockId, expiration)
            local currentState = lockStorage.find(key)
            if currentState ~= nil and currentState.owner ~= lockId then
                return 0
            end

            lockStorage.save(key, {
                owner = lockId,
                expiration = expiration or 0,
            })

            return 1
        end,

        -- @param key string
        -- @param lockId string
        -- @return 1 | 0
        release = function(key, lockId)
            local currentState = lockStorage.find(key)
            if currentState == nil then
                return 0
            end

            if currentState.owner ~= lockId then
                return 0
            end

            lockStorage.remove(key)

            return 1
        end,

        -- @param key string
        -- @return 1 | 0
        forceRelease = function(key)
            local currentState = lockStorage.find(key)
            if currentState == nil then
                return 0
            end

            lockStorage.remove(key)

            return 1
        end,

        -- @param key string
        -- @param lockId string
        -- @param expiration number
        -- @return 1 | 0
        refresh = function(key, lockId, expiration)
            local currentState = lockStorage.find(key)
            if currentState == nil then
                return 0
            end

            if currentState.owner ~= lockId then
                return 0
            end

            local currentExpiration = currentState.expiration
            local isUnexpireable = currentExpiration == nil or currentExpiration == 0
            if isUnexpireable then
                return 0
            end

            lockStorage.save(key, {
                owner = currentState.owner,
                expiration = expiration,
            })

            return 1
        end,

        -- @param key string
        -- @return IRedisJsonLockState | nil
        getState = function(key)
            return lockStorage.find(key)
        end,
    }
end
`;
