/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @module RateLimiter
 */

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/implementations/policies/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type { ConstantBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type { IRateLimiterAdapter } from "@/rate-limiter/contracts/_module-exports.js";
import type { SlidingWindowLimiterSettingsEnum } from "@/rate-limiter/implementations/policies/_module-exports.js";
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
    margin: TimeSpan.fromMilliseconds(25),
    window: TimeSpan.fromMilliseconds(100),
};

/**
 * @group TestUtilities
 */
const backoffPolicySettings: Required<ConstantBackoffSettingsEnum> = {
    type: BACKOFFS.CONSTANT,
    delay: TimeSpan.fromMilliseconds(50),
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
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);
    describe("sliding-window-limiter IRateLimiterAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        async function delayWithBuffer(timeSpan: TimeSpan): Promise<void> {
            await delay(
                TimeSpan.fromTimeSpan(timeSpan).addTimeSpan(delayBuffer),
            );
        }

        describe("method: getState", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / trackSuccess", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / isolate / getState", () => {
            test.todo("Write tests!!!");
        });
        describe("method: updateState / trackFailure / reset", () => {
            test.todo("Write tests!!!");
        });
    });
}

slidingWindowLimiterTestSuite.rateLimiterPolicySettings =
    rateLimiterPolicySettings;
slidingWindowLimiterTestSuite.backoffPolicySettings = backoffPolicySettings;
