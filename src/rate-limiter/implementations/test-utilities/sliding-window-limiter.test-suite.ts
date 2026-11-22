/**
 * @module RateLimiter
 */

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type { ConstantBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { SlidingWindowLimiterSettingsEnum } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/test-utilities"`
 * @group TestUtilities
 */
export type SlidingWindowLimiterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IRateLimiterAdapter>;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;
};

/**
 * @group TestUtilities
 */
const rateLimiterPolicySettings: Required<SlidingWindowLimiterSettingsEnum> = {
    type: LIMITER_POLICIES.SLIDING_WINDOW,
    margin: TimeSpan.fromMilliseconds(125),
    window: TimeSpan.fromMilliseconds(500),
};

/**
 * @group TestUtilities
 */
const backoffPolicySettings: Required<ConstantBackoffSettingsEnum> = {
    type: BACKOFFS.CONSTANT,
    delay: TimeSpan.fromMilliseconds(1000),
    jitter: null,
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/test-utilities"`
 * @group TestUtilities
 */
export function slidingWindowLimiterTestSuite(
    settings: SlidingWindowLimiterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: IRateLimiterAdapter;
    describe("sliding-window-limiter IRateLimiterAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        const LIMIT = 4;
        const window = TimeSpan.fromTimeSpan(rateLimiterPolicySettings.window);

        /**
         * Waits until the next window starts.
         */
        async function delayUntilNextWindow(): Promise<void> {
            const windowSize = window.toMilliseconds();
            const now = Date.now();
            const nextWindowStart =
                Math.floor(now / windowSize) * windowSize + windowSize;
            await delay(
                TimeSpan.fromMilliseconds(nextWindowStart - now).addTimeSpan(
                    delayBuffer,
                ),
            );
        }

        /**
         * Starts the test at the beginning of a window so that all the
         * attempts of a test fall in the same window.
         */
        async function alignToWindow(): Promise<void> {
            await delayUntilNextWindow();
        }

        /**
         * Waits until the stored state is expired. The reset time is an
         * absolute timestamp, so the state can outlive it when the storage
         * clock is not in sync with the clock of the adapter.
         */
        async function waitUntilExpired(): Promise<void> {
            await expect
                .poll(async () => await adapter.getState(KEY), {
                    timeout: TimeSpan.fromSeconds(10).toMilliseconds(),
                })
                .toBeNull();
        }

        describe("method: getState", () => {
            test("Should return null when updateState has not been called", async () => {
                const state = await adapter.getState(KEY);

                expect(state).toBeNull();
            });
            test("Should return AllowedState attempt when 3 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: true,
                    attempt: 3,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState when 4 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: false,
                    attempt: 1,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState attempt when 5 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: false,
                    attempt: 2,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState attempt when 6 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.getState(KEY);

                expect(state).toEqual({
                    success: false,
                    attempt: 3,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return null when 3 attempts occurs during window time and resetTime is awaited", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await waitUntilExpired();
            });
            test("Should return null when 4 attempts occurs during window time and resetTime is awaited", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await waitUntilExpired();
            });
        });
        describe("method: updateState", () => {
            test("Should return AllowedState with attempt 1 when 1 attempt occurs during window time", async () => {
                await alignToWindow();

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: true,
                    attempt: 1,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return AllowedState with incremented attempt when 2 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: true,
                    attempt: 2,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return AllowedState with incremented attempt when 3 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: true,
                    attempt: 3,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState when 4 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: false,
                    attempt: 1,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState with incremented attempt when 5 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: false,
                    attempt: 2,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return BlockedState with incremented attempt when 6 attempts occurs during window time", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: false,
                    attempt: 3,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return reseted AllowedState when 3 attempts occurs during window time and resetTime is awaited", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await waitUntilExpired();

                const state2 = await adapter.updateState(KEY, LIMIT);
                expect(state2).toEqual({
                    success: true,
                    attempt: 1,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should return reseted AllowedState when 4 attempts occurs during window time and resetTime is awaited", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await waitUntilExpired();

                const state2 = await adapter.updateState(KEY, LIMIT);
                expect(state2).toEqual({
                    success: true,
                    attempt: 1,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
        });
        describe("method: updateState / sliding window", () => {
            test("Should include attempts from the previous window", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await delayUntilNextWindow();
                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: true,
                    attempt: 3,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
            test("Should drop attempts from windows older than the previous window", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await delayUntilNextWindow();
                await delayUntilNextWindow();
                const state = await adapter.updateState(KEY, LIMIT);

                expect(state).toEqual({
                    success: true,
                    attempt: 1,
                    resetTime: expect.any(Date) as Date,
                } satisfies IRateLimiterAdapterState);
            });
        });
        describe("method: reset", () => {
            test("Should return null when reseted in AllowedState", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await adapter.reset(KEY);
                const state = await adapter.getState(KEY);

                expect(state).toBeNull();
            });
            test("Should return null when reseted in BlockedState", async () => {
                await alignToWindow();
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);
                await adapter.updateState(KEY, LIMIT);

                await adapter.reset(KEY);
                const state = await adapter.getState(KEY);

                expect(state).toBeNull();
            });
        });
    });
}

slidingWindowLimiterTestSuite.rateLimiterPolicySettings =
    rateLimiterPolicySettings;
slidingWindowLimiterTestSuite.backoffPolicySettings = backoffPolicySettings;
