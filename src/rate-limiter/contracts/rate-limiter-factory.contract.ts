/**
 * @module RateLimiter
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BlockedRateLimiterError } from "@/rate-limiter/contracts/rate-limiter.errors.js";

import type { IRateLimiter } from "@/rate-limiter/contracts/rate-limiter.contract.js";
import type { ErrorPolicySettings } from "@/utilities/_module-exports.js";

/**
 * Settings passed to {@link IRateLimiterFactory.create | `IRateLimiterFactory.create`}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterFactoryCreateSettings = ErrorPolicySettings & {
    /**
     * When `true`, only calls that throw count against the limit.
     * Defaults to the factory's `onlyError` setting.
     */
    onlyError?: boolean;

    /**
     * Maximum invocations allowed per policy window. Once reached, calls fail with
     * {@link BlockedRateLimiterError | `BlockedRateLimiterError`} until the policy allows attempts again.
     */
    limit: number;
};

/**
 * Creates rate limiter instances.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterFactory = {
    /**
     * Creates a rate limiter for `key`.
     *
     * @param key - Identifier of the quota; instances with the same key share it
     * @param settings - Limit and error policy for this instance
     * @returns A rate limiter bound to `key`
     */
    create(
        key: string,
        settings: RateLimiterFactoryCreateSettings,
    ): IRateLimiter;
};
