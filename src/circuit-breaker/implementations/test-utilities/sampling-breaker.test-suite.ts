/**
 * @module CircuitBreaker
 */

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import {
    BREAKER_POLICIES,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type { ConstantBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    CircuitBreakerStateTransition,
    ICircuitBreakerAdapter,
    SamplingBreakerSettingsEnum,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/test-utilities"`
 * @group TestUtilities
 */
export type SamplingBreakerTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<ICircuitBreakerAdapter>;

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
const circuitBreakerPolicySettings: Required<SamplingBreakerSettingsEnum> = {
    type: BREAKER_POLICIES.SAMPLING,
    failureThreshold: 0.2,
    successThreshold: 0.8,
    timeSpan: TimeSpan.fromMinutes(1),
    sampleTimeSpan: TimeSpan.fromSeconds(10),
    minimumRps: 5,
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
 * The policy does not evaluate the thresholds until the sampled calls reach
 * `timeSpan (in seconds) * minimumRps` calls.
 *
 * @group TestUtilities
 */
const minimumCallCount = Math.ceil(
    TimeSpan.fromTimeSpan(circuitBreakerPolicySettings.timeSpan).toSeconds() *
        circuitBreakerPolicySettings.minimumRps,
);

/**
 * The number of failures the policy considers to be within
 * `failureThreshold` for `minimumCallCount` calls.
 *
 * @group TestUtilities
 */
const failureThresholdCallCount = Math.ceil(
    circuitBreakerPolicySettings.failureThreshold * minimumCallCount,
);

/**
 * The number of successes the policy considers to be within
 * `successThreshold` for `minimumCallCount` calls.
 *
 * @group TestUtilities
 */
const successThresholdCallCount = Math.ceil(
    circuitBreakerPolicySettings.successThreshold * minimumCallCount,
);

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/test-utilities"`
 * @group TestUtilities
 */
export function samplingBreakerTestSuite(
    settings: SamplingBreakerTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;
    let adapter: ICircuitBreakerAdapter;
    const waitTime = TimeSpan.fromTimeSpan(backoffPolicySettings.delay);
    describe("sampling-breaker ICircuitBreakerAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });

        const KEY = "a";
        async function delayWithBuffer(timeSpan: ITimeSpan): Promise<void> {
            await delay(
                TimeSpan.fromTimeSpan(timeSpan).addTimeSpan(delayBuffer),
            );
        }

        async function trackFailures(count: number): Promise<void> {
            for (let index = 0; index < count; index++) {
                await adapter.trackFailure(KEY);
            }
        }

        async function trackSuccesses(count: number): Promise<void> {
            for (let index = 0; index < count; index++) {
                await adapter.trackSuccess(KEY);
            }
        }

        async function trackWithinFailureThreshold(): Promise<void> {
            await trackFailures(failureThresholdCallCount);
            await trackSuccesses(minimumCallCount - failureThresholdCallCount);
        }

        async function trackAboveFailureThreshold(): Promise<void> {
            await trackFailures(failureThresholdCallCount + 1);
            await trackSuccesses(
                minimumCallCount - failureThresholdCallCount - 1,
            );
        }

        async function trackWithinSuccessThreshold(): Promise<void> {
            await trackSuccesses(successThresholdCallCount);
            await trackFailures(minimumCallCount - successThresholdCallCount);
        }

        async function trackAboveSuccessThreshold(): Promise<void> {
            await trackSuccesses(successThresholdCallCount + 1);
            await trackFailures(
                minimumCallCount - successThresholdCallCount - 1,
            );
        }

        async function openCircuit(): Promise<void> {
            await trackFailures(minimumCallCount);
            await adapter.updateState(KEY);
        }

        async function halfOpenCircuit(): Promise<void> {
            await openCircuit();
            await delayWithBuffer(waitTime);
            await adapter.updateState(KEY);
        }

        async function closeCircuit(): Promise<void> {
            await halfOpenCircuit();
            await trackAboveSuccessThreshold();
            await adapter.updateState(KEY);
        }

        async function reopenCircuit(): Promise<void> {
            await halfOpenCircuit();
            await trackWithinSuccessThreshold();
            await adapter.updateState(KEY);
        }

        describe("method: getState", () => {
            test("Should return CIRCUIT_BREAKER_STATE.CLOSED as initial state", async () => {
                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should return CIRCUIT_BREAKER_STATE.CLOSED when in ClosedState", async () => {
                await trackFailures(minimumCallCount - 1);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should return CIRCUIT_BREAKER_STATE.OPEN when in OpenedState", async () => {
                await openCircuit();

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.OPEN);
            });
            test("Should return CIRCUIT_BREAKER_STATE.HALF_OPEN when in HalfOpenedState", async () => {
                await halfOpenCircuit();

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.HALF_OPEN);
            });
            test("Should return CIRCUIT_BREAKER_STATE.ISOLATED when in IsolatedState", async () => {
                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
        });
        describe("method: updateState / trackFailure / trackSuccess", () => {
            test("Should transition ClosedState -> ClosedState when minimum call count has not been reached", async () => {
                await trackFailures(minimumCallCount - 1);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> ClosedState when failure threshold has not been exceeded", async () => {
                await trackWithinFailureThreshold();
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState when failure threshold has been exceeded", async () => {
                await trackAboveFailureThreshold();
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> OpenedState when wait time is not reached", async () => {
                await openCircuit();

                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState when wait time is reached", async () => {
                await openCircuit();

                await delayWithBuffer(waitTime);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition HalfOpenedState -> HalfOpenedState when minimum call count has not been reached", async () => {
                await halfOpenCircuit();

                await trackFailures(minimumCallCount - 1);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition HalfOpenedState -> OpenedState when success threshold has not been exceeded", async () => {
                await halfOpenCircuit();

                await trackWithinSuccessThreshold();
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition HalfOpenedState -> ClosedState when success threshold has been exceeded", async () => {
                await halfOpenCircuit();

                await trackAboveSuccessThreshold();
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition HalfOpenedState -> OpenedState -> OpenedState when wait time is not reached", async () => {
                await reopenCircuit();

                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition HalfOpenedState -> OpenedState -> HalfOpenedState when wait time is reached", async () => {
                await reopenCircuit();

                await delayWithBuffer(waitTime);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition HalfOpenedState -> ClosedState -> ClosedState when minimum call count has not been reached", async () => {
                await closeCircuit();

                await trackFailures(minimumCallCount - 1);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition HalfOpenedState -> ClosedState -> OpenedState when failure threshold has been exceeded", async () => {
                await closeCircuit();

                await trackAboveFailureThreshold();
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should transition ClosedState -> OpenedState -> HalfOpenedState -> OpenedState -> HalfOpenedState -> ClosedState", async () => {
                await openCircuit();

                await delayWithBuffer(waitTime);
                await adapter.updateState(KEY);

                await trackWithinSuccessThreshold();
                await adapter.updateState(KEY);

                await delayWithBuffer(waitTime);
                await adapter.updateState(KEY);

                await trackAboveSuccessThreshold();
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should not track failures and successes when in OpenedState", async () => {
                await openCircuit();

                await trackFailures(minimumCallCount);
                await trackSuccesses(minimumCallCount);

                await delayWithBuffer(waitTime);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.OPEN,
                    to: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                } satisfies CircuitBreakerStateTransition);
            });
            test("Should not track failures and successes when in IsolatedState", async () => {
                await adapter.isolate(KEY);

                await trackFailures(minimumCallCount);
                await trackSuccesses(minimumCallCount);
                const state = await adapter.updateState(KEY);

                expect(state).toEqual({
                    from: CIRCUIT_BREAKER_STATE.ISOLATED,
                    to: CIRCUIT_BREAKER_STATE.ISOLATED,
                } satisfies CircuitBreakerStateTransition);
            });
        });
        describe("method: updateState / trackFailure / isolate", () => {
            test("Should transition to IsolatedState when in ClosedState", async () => {
                await trackWithinFailureThreshold();
                await adapter.updateState(KEY);

                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
            test("Should transition to IsolatedState when in OpenedState", async () => {
                await openCircuit();

                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
            test("Should transition to IsolatedState when in HalfOpenState", async () => {
                await halfOpenCircuit();

                await adapter.isolate(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.ISOLATED);
            });
        });
        describe("method: updateState / trackFailure / reset", () => {
            test("Should reset when in ClosedState", async () => {
                await trackWithinFailureThreshold();
                await adapter.updateState(KEY);

                await adapter.reset(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in OpenedState", async () => {
                await openCircuit();

                await adapter.reset(KEY);

                await adapter.trackFailure(KEY);
                await adapter.updateState(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in HalfOpenState", async () => {
                await halfOpenCircuit();

                await adapter.reset(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
            test("Should reset when in IsolatedState", async () => {
                await adapter.isolate(KEY);

                await adapter.reset(KEY);

                const state = await adapter.getState(KEY);

                expect(state).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
            });
        });
    });
}

samplingBreakerTestSuite.circuitBreakerPolicySettings =
    circuitBreakerPolicySettings;
samplingBreakerTestSuite.backoffPolicySettings = backoffPolicySettings;
