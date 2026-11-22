/**
 * @module RateLimiter
 */

/**
 * @internal
 */
export const slidingWindowLimiterLua = `
-- @param settings Required<SerializedSlidingWindowLimiterSettings>
-- @return IRateLimiterPolicy<SlidingWindowLimiterState>
local function SlidingWindowLimiter(settings)
    -- @param currentDate number
    -- @return number
    local function currentWindow(currentDate)
        return math.floor(currentDate / settings.window) * settings.window
    end

    -- @param currentDate number
    -- @return number
    local function previousWindow(currentDate)
        return currentWindow(currentDate) - settings.window
    end

    -- @param metrics SlidingWindowLimiterState
    -- @param currentDate number
    -- @return SlidingWindowLimiterState
    local function cleanup(metrics, currentDate)
        local previousWindow_ = previousWindow(currentDate)
        local newMetrics = {}

        for key, value in pairs(metrics) do
            local timeStamp = tonumber(key)
            if timeStamp ~= nil and timeStamp >= previousWindow_ then
                newMetrics[key] = value
            end
        end

        return newMetrics
    end

    -- @param currentMetrics SlidingWindowLimiterState
    -- @param windowStart number
    -- @return number
    local function attemptsAt(currentMetrics, windowStart)
        local attempts = currentMetrics[tostring(windowStart)]
        if attempts == nil or attempts == cjson.null then
            return 0
        end

        return attempts
    end

    -- @param currentMetrics SlidingWindowLimiterState
    -- @param currentDate number
    -- @return number
    local function currentAttempt(currentMetrics, currentDate)
        return attemptsAt(currentMetrics, currentWindow(currentDate))
    end

    -- @param currentMetrics SlidingWindowLimiterState
    -- @param currentDate number
    -- @return number
    local function previousAttempt(currentMetrics, currentDate)
        local previousAttempt_ = attemptsAt(
            currentMetrics,
            previousWindow(currentDate)
        )

        local percentageInCurrentWindow = currentDate % settings.window / settings.window
        return math.floor((1 - percentageInCurrentWindow) * previousAttempt_)
    end

    return {
        -- @param currentDate number
        -- @return SlidingWindowLimiterState
        initialMetrics = function(currentDate)
            local metrics = {}
            metrics[tostring(currentWindow(currentDate))] = 0
            return metrics
        end,

        -- @param currentMetrics SlidingWindowLimiterState
        -- @param limit number
        -- @param currentDate number
        -- @return boolean
        shouldBlock = function(currentMetrics, limit, currentDate)
            local currentAttempt_ = currentAttempt(currentMetrics, currentDate)
            local previousAttempt_ = previousAttempt(currentMetrics, currentDate)
            return currentAttempt_ + previousAttempt_ >= limit
        end,

        -- @param _currentMetrics SlidingWindowLimiterState
        -- @param currentDate number
        -- @return number
        getExpiration = function(_currentMetrics, currentDate)
            return currentWindow(currentDate) + settings.window * 2 + settings.margin
        end,

        -- @param currentMetrics SlidingWindowLimiterState
        -- @param currentDate number
        -- @return number
        getAttempts = function(currentMetrics, currentDate)
            local currentAttempt_ = currentAttempt(currentMetrics, currentDate)
            local previousAttempt_ = previousAttempt(currentMetrics, currentDate)
            return currentAttempt_ + previousAttempt_
        end,

        -- @param currentMetrics SlidingWindowLimiterState
        -- @param currentDate number
        -- @return SlidingWindowLimiterState
        updateMetrics = function(currentMetrics, currentDate)
            local currentMetrics_ = cleanup(currentMetrics, currentDate)
            local currentAttempt_ = currentAttempt(currentMetrics_, currentDate)
            currentMetrics_[tostring(currentWindow(currentDate))] = currentAttempt_ + 1
            return currentMetrics_
        end
    }
end
`;
