/**
 * @module RateLimiter
 */

import { RATE_LIMITER_STATE } from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Mirrors `RateLimiterStorage` (memory adapter): state is stored together with
 * its expiration, expired entries are treated as missing and the key TTL is
 * relative so it never depends on the Redis server clock.
 *
 * @internal
 */
export const rateLimterStorageLua = `
-- @template TMetrics
-- @param rateLimiterPolicy InternalRateLimiterPolicy<TMetrics>
-- @param backoffPolicy BackoffPolicy
-- @param currentDate number
local function RateLimiterStorage(rateLimiterPolicy, backoffPolicy, currentDate)
    -- @param key string
    -- @return MemoryRateLimiterData<AllRateLimiterState<TMetrics>> | nil
    local function findData(key)
        local data = redis.call("get", key)
        if data == false or data == nil then
            return nil
        end

        return cjson.decode(data)
    end

    -- @param data MemoryRateLimiterData<AllRateLimiterState<TMetrics>> | nil
    -- @return AllRateLimiterState<TMetrics> | nil
    local function resolveStorageData(data)
        if data == nil then
            return nil
        end

        if data.expiration <= currentDate then
            return nil
        end

        return data.state
    end

    -- @param state AllRateLimiterState<TMetrics>
    -- @return IRedisJsonRateLimiterState
    local function toAdapterState(state)
        return {
            success = state.type == "${RATE_LIMITER_STATE.ALLOWED}",
            attempt = rateLimiterPolicy.getAttempts(state, currentDate),
            resetTime = rateLimiterPolicy.getExpiration(state, {
                backoffPolicy = backoffPolicy,
                currentDate = currentDate,
            }),
        }
    end

    return {
        -- @param args AtomicUpdateArgs<TMetrics>
        -- @return IRedisJsonRateLimiterState
        update = function(args)
            local currentState = resolveStorageData(findData(args.key))
            if currentState == nil then
                currentState = rateLimiterPolicy.initialState(currentDate)
            end

            local newState = args.update(currentState)

            local expiration = rateLimiterPolicy.getExpiration(newState, {
                backoffPolicy = backoffPolicy,
                currentDate = currentDate,
            })

            local timeToLive = math.ceil(expiration - currentDate)
            if timeToLive > 0 then
                redis.call("set", args.key, cjson.encode({
                    state = newState,
                    expiration = expiration,
                }), "px", timeToLive)
            else
                redis.call("del", args.key)
            end

            return toAdapterState(newState)
        end,

        -- @param key string
        -- @return IRedisJsonRateLimiterState | nil
        find = function(key)
            local state = resolveStorageData(findData(key))
            if state == nil then
                return nil
            end

            return toAdapterState(state)
        end,
    }
end
`;
