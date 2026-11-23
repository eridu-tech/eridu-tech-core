import { describe, expect, test } from "vitest";

import { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/_module-exports.js";
import {
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import { SamplingBreaker } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/policies/sampling-breaker/sampling-breaker.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { SamplingBreakerMetrics } from "@/circuit-breaker/contracts/_module-exports.js";

describe(
    "class: SamplingBreaker",
    { tags: ["Memory", "Implementations", "CircuitBreaker"] },
    () => {
        describe("constructor", () => {
            test(`Should throw TypeError when failureThreshold is an integer`, () => {
                expect(
                    () =>
                        new SamplingBreaker({
                            failureThreshold: 1,
                        }),
                ).toThrow(TypeError);
            });
            test(`Should throw RangeError when failureThreshold is negative`, () => {
                expect(
                    () =>
                        new SamplingBreaker({
                            failureThreshold: -0.5,
                        }),
                ).toThrow(RangeError);
            });
            test(`Should throw RangeError when failureThreshold is greater than 1`, () => {
                expect(
                    () =>
                        new SamplingBreaker({
                            failureThreshold: 1.5,
                        }),
                ).toThrow(RangeError);
            });
            test(`Should throw TypeError when successThreshold is an integer`, () => {
                expect(
                    () =>
                        new SamplingBreaker({
                            failureThreshold: 0.5,
                            successThreshold: 1,
                        }),
                ).toThrow(TypeError);
            });
            test(`Should throw RangeError when successThreshold is negative`, () => {
                expect(
                    () =>
                        new SamplingBreaker({
                            failureThreshold: 0.5,
                            successThreshold: -0.5,
                        }),
                ).toThrow(RangeError);
            });
            test(`Should throw RangeError when successThreshold is greater than 1`, () => {
                expect(
                    () =>
                        new SamplingBreaker({
                            failureThreshold: 0.5,
                            successThreshold: 1.5,
                        }),
                ).toThrow(RangeError);
            });
        });
        describe("method: initialMetrics", () => {
            test(`Should return an object with an empty "samples" array field`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const newMetrics = policy.initialMetrics();

                expect(newMetrics).toEqual({
                    samples: [],
                } satisfies SamplingBreakerMetrics);
            });
        });
        describe("method: whenClosed", () => {
            test(`Should return CLOSED_TRANSITIONS.NONE when "samples" array field is empty`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
            });
            test(`Should return CLOSED_TRANSITIONS.NONE when total calls is less than minimum and 100% failures`, () => {
                // minimumRps=1, timeSpan=10s => minimum = ceil(10*1) = 10
                // total=9 < 10 => minimum not met
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 9,
                                successes: 0,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
            });
            test(`Should return CLOSED_TRANSITIONS.TO_OPEN when total calls exceeds minimum and failures exceed threshold`, () => {
                // minimumRps=1, timeSpan=10s => minimum = ceil(10*1) = 10
                // failureThreshold=0.5, total=12, failureCount = ceil(0.5*12) = 6
                // totalFailures=8 > 6 => TO_OPEN
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 8,
                                successes: 4,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.TO_OPEN);
            });
            test(`Should return CLOSED_TRANSITIONS.TO_OPEN when total calls exceeds minimum and 100% failures`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 11,
                                successes: 0,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.TO_OPEN);
            });
            test(`Should return CLOSED_TRANSITIONS.NONE when total calls exceeds minimum and failures do not exceed threshold`, () => {
                // failureThreshold=0.5, total=12, failureCount = ceil(0.5*12) = 6
                // totalFailures=4 <= 6 => NONE
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 4,
                                successes: 8,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
            });
            test(`Should return CLOSED_TRANSITIONS.NONE when total calls exceeds minimum and 0% failures`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 0,
                                successes: 11,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
            });
            test(`Should return CLOSED_TRANSITIONS.NONE when failures equal the threshold exactly`, () => {
                // failureThreshold=0.5, total=12, failureCount = ceil(0.5*12) = 6
                // totalFailures=6 is NOT > 6 => NONE
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 6,
                                successes: 6,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.NONE);
            });
            test(`Should aggregate failures and successes across multiple samples`, () => {
                // total = (3+2) + (5+2) = 12, totalFailures = 3+5 = 8
                // failureCount = ceil(0.5*12) = 6, 8 > 6 => TO_OPEN
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 3,
                                successes: 2,
                            },
                            {
                                startedAt: Date.now(),
                                failures: 5,
                                successes: 2,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.TO_OPEN);
            });
            test(`Should evaluate transition when total calls exactly equals minimum`, () => {
                // minimumRps=1, timeSpan=10s => minimum = ceil(10*1) = 10
                // total=10 equals minimum => minimum IS met
                // failureThreshold=0.5, failureCount = ceil(0.5*10) = 5
                // totalFailures=8 > 5 => TO_OPEN
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenClosed(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 8,
                                successes: 2,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(CLOSED_TRANSITIONS.TO_OPEN);
            });
        });
        describe("method: whenHalfOpened", () => {
            test(`Should return HALF_OPEN_TRANSITIONS.NONE when "samples" array field is empty`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
            });
            test(`Should return HALF_OPEN_TRANSITIONS.NONE when total calls is less than minimum`, () => {
                // minimumRps=1, timeSpan=10s => minimum = ceil(10*1) = 10
                // total=9 < 10 => minimum not met
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 0,
                                successes: 9,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.NONE);
            });
            test(`Should return HALF_OPEN_TRANSITIONS.TO_CLOSED when total calls exceeds minimum and successes exceed threshold`, () => {
                // successThreshold = 1 - 0.5 = 0.5, total=12, successCount = ceil(0.5*12) = 6
                // totalSuccesses=8 > 6 => TO_CLOSED
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 4,
                                successes: 8,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_CLOSED);
            });
            test(`Should return HALF_OPEN_TRANSITIONS.TO_CLOSED when total calls exceeds minimum and 100% successes`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 0,
                                successes: 11,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_CLOSED);
            });
            test(`Should return HALF_OPEN_TRANSITIONS.TO_OPEN when total calls exceeds minimum and successes do not exceed threshold`, () => {
                // successThreshold = 0.5, total=12, successCount = ceil(0.5*12) = 6
                // totalSuccesses=4 <= 6 => TO_OPEN
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 8,
                                successes: 4,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
            });
            test(`Should return HALF_OPEN_TRANSITIONS.TO_OPEN when total calls exceeds minimum and 0% successes`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 11,
                                successes: 0,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
            });
            test(`Should return HALF_OPEN_TRANSITIONS.TO_OPEN when successes equal the threshold exactly`, () => {
                // successThreshold = 0.5, total=12, successCount = ceil(0.5*12) = 6
                // totalSuccesses=6 is NOT > 6 => TO_OPEN
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 6,
                                successes: 6,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
            });
            test(`Should aggregate successes and failures across multiple samples`, () => {
                // total = (2+3) + (2+5) = 12, totalSuccesses = 3+5 = 8
                // successCount = ceil(0.5*12) = 6, 8 > 6 => TO_CLOSED
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 2,
                                successes: 3,
                            },
                            {
                                startedAt: Date.now(),
                                failures: 2,
                                successes: 5,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_CLOSED);
            });
            test(`Should evaluate transition when total calls exactly equals minimum`, () => {
                // minimumRps=1, timeSpan=10s => minimum = ceil(10*1) = 10
                // total=10, successThreshold=0.5, successCount=ceil(0.5*10)=5
                // totalSuccesses=8 > 5 => TO_CLOSED
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 2,
                                successes: 8,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_CLOSED);
            });
            test(`Should use custom successThreshold when provided`, () => {
                // successThreshold=0.8, total=12, successCount=ceil(0.8*12)=ceil(9.6)=10
                // totalSuccesses=9 <= 10 => TO_OPEN
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    successThreshold: 0.8,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const transition = policy.whenHalfOpened(
                    {
                        samples: [
                            {
                                startedAt: Date.now(),
                                failures: 3,
                                successes: 9,
                            },
                        ],
                    },
                    new Date(),
                );

                expect(transition).toBe(HALF_OPEN_TRANSITIONS.TO_OPEN);
            });
        });
        describe("method: trackFailure", () => {
            test(`Should create a new sample when "samples" is empty`, () => {
                const currentDate = new Date();
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const newMetrics = policy.trackFailure(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: currentDate.getTime(),
                            failures: 1,
                            successes: 0,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should increment failure count of the current sample`, () => {
                const currentDate = new Date();
                // sampleTimeSpan=2s => sampleEnd = currentDate + 2s
                // sampleEnd > currentDate => the sample is not ended
                const sampleStart = currentDate.getTime();
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackFailure(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: sampleStart,
                                    failures: 2,
                                    successes: 3,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: sampleStart,
                            failures: 3,
                            successes: 3,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should not mutate the samples it receives`, () => {
                const currentDate = new Date();
                const sampleStart = currentDate.getTime();
                const currentMetrics = {
                    samples: [
                        {
                            startedAt: sampleStart,
                            failures: 2,
                            successes: 3,
                        },
                    ],
                } satisfies SamplingBreakerMetrics;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                policy.trackFailure(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: currentMetrics,
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(currentMetrics.samples).toEqual([
                    {
                        startedAt: sampleStart,
                        failures: 2,
                        successes: 3,
                    },
                ]);
            });
            test(`Should drop samples that are outside the time window and create a new sample`, () => {
                const currentDate = new Date();
                // timeSpan=10s, sampleTimeSpan=2s
                // windowStart = currentDate - 10s
                // sampleEnd = oldSampleStart + 2s = currentDate - 18s
                // sampleEnd < windowStart => sample is dropped
                const oldSampleStart = currentDate.getTime() - 20 * 1000;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackFailure(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: oldSampleStart,
                                    failures: 2,
                                    successes: 3,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: currentDate.getTime(),
                            failures: 1,
                            successes: 0,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should keep ended samples that are within the time window and create a new sample`, () => {
                const currentDate = new Date();
                // timeSpan=10s, sampleTimeSpan=2s
                // windowStart = currentDate - 10s
                // sampleEnd = (currentDate - 5s) + 2s = currentDate - 3s
                // sampleEnd >= windowStart => sample is kept
                // sampleEnd <= currentDate => the sample is ended
                const recentSampleStart = currentDate.getTime() - 5 * 1000;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackFailure(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: recentSampleStart,
                                    failures: 5,
                                    successes: 5,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: recentSampleStart,
                            failures: 5,
                            successes: 5,
                        },
                        {
                            startedAt: currentDate.getTime(),
                            failures: 1,
                            successes: 0,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should work with half-open state`, () => {
                const currentDate = new Date();
                const sampleStart = currentDate.getTime();
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackFailure(
                    {
                        type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                        metrics: {
                            samples: [
                                {
                                    startedAt: sampleStart,
                                    failures: 1,
                                    successes: 0,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: sampleStart,
                            failures: 2,
                            successes: 0,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should keep samples within the time window and drop samples outside it`, () => {
                const currentDate = new Date();
                // timeSpan=10s, sampleTimeSpan=2s
                // windowStart = currentDate - 10s
                // Sample 1 (old, outside window): sampleEnd = (currentDate - 20s) + 2s = currentDate - 18s < windowStart => DROPPED
                // Sample 2 (recent, within window): sampleEnd = (currentDate - 5s) + 2s = currentDate - 3s >= windowStart => KEPT
                const oldSampleStart = currentDate.getTime() - 20 * 1000;
                const recentSampleStart = currentDate.getTime() - 5 * 1000;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackFailure(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: oldSampleStart,
                                    failures: 2,
                                    successes: 3,
                                },
                                {
                                    startedAt: recentSampleStart,
                                    failures: 5,
                                    successes: 5,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: recentSampleStart,
                            failures: 5,
                            successes: 5,
                        },
                        {
                            startedAt: currentDate.getTime(),
                            failures: 1,
                            successes: 0,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
        });
        describe("method: trackSuccess", () => {
            test(`Should create a new sample when "samples" is empty`, () => {
                const currentDate = new Date();
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const newMetrics = policy.trackSuccess(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: currentDate.getTime(),
                            failures: 0,
                            successes: 1,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should increment success count of the current sample`, () => {
                const currentDate = new Date();
                // sampleTimeSpan=2s => sampleEnd = currentDate + 2s
                // sampleEnd > currentDate => the sample is not ended
                const sampleStart = currentDate.getTime();
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackSuccess(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: sampleStart,
                                    failures: 2,
                                    successes: 3,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: sampleStart,
                            failures: 2,
                            successes: 4,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should not mutate the samples it receives`, () => {
                const currentDate = new Date();
                const sampleStart = currentDate.getTime();
                const currentMetrics = {
                    samples: [
                        {
                            startedAt: sampleStart,
                            failures: 2,
                            successes: 3,
                        },
                    ],
                } satisfies SamplingBreakerMetrics;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                policy.trackSuccess(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: currentMetrics,
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(currentMetrics.samples).toEqual([
                    {
                        startedAt: sampleStart,
                        failures: 2,
                        successes: 3,
                    },
                ]);
            });
            test(`Should drop samples that are outside the time window and create a new sample`, () => {
                const currentDate = new Date();
                // timeSpan=10s, sampleTimeSpan=2s
                // windowStart = currentDate - 10s
                // sampleEnd = oldSampleStart + 2s = currentDate - 18s
                // sampleEnd < windowStart => sample is dropped
                const oldSampleStart = currentDate.getTime() - 20 * 1000;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackSuccess(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: oldSampleStart,
                                    failures: 2,
                                    successes: 3,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: currentDate.getTime(),
                            failures: 0,
                            successes: 1,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should keep ended samples that are within the time window and create a new sample`, () => {
                const currentDate = new Date();
                // timeSpan=10s, sampleTimeSpan=2s
                // windowStart = currentDate - 10s
                // sampleEnd = (currentDate - 5s) + 2s = currentDate - 3s
                // sampleEnd >= windowStart => sample is kept
                // sampleEnd <= currentDate => the sample is ended
                const recentSampleStart = currentDate.getTime() - 5 * 1000;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackSuccess(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: recentSampleStart,
                                    failures: 5,
                                    successes: 5,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: recentSampleStart,
                            failures: 5,
                            successes: 5,
                        },
                        {
                            startedAt: currentDate.getTime(),
                            failures: 0,
                            successes: 1,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should work with half-open state`, () => {
                const currentDate = new Date();
                const sampleStart = currentDate.getTime();
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackSuccess(
                    {
                        type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                        metrics: {
                            samples: [
                                {
                                    startedAt: sampleStart,
                                    failures: 0,
                                    successes: 1,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: sampleStart,
                            failures: 0,
                            successes: 2,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
            test(`Should keep samples within the time window and drop samples outside it`, () => {
                const currentDate = new Date();
                // timeSpan=10s, sampleTimeSpan=2s
                // windowStart = currentDate - 10s
                // Sample 1 (old, outside window): sampleEnd = (currentDate - 20s) + 2s = currentDate - 18s < windowStart => DROPPED
                // Sample 2 (recent, within window): sampleEnd = (currentDate - 5s) + 2s = currentDate - 3s >= windowStart => KEPT
                const oldSampleStart = currentDate.getTime() - 20 * 1000;
                const recentSampleStart = currentDate.getTime() - 5 * 1000;
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                    sampleTimeSpan: TimeSpan.fromSeconds(2),
                });

                const newMetrics = policy.trackSuccess(
                    {
                        type: CIRCUIT_BREAKER_STATE.CLOSED,
                        metrics: {
                            samples: [
                                {
                                    startedAt: oldSampleStart,
                                    failures: 2,
                                    successes: 3,
                                },
                                {
                                    startedAt: recentSampleStart,
                                    failures: 5,
                                    successes: 5,
                                },
                            ],
                        },
                    },
                    {
                        currentDate,
                        initialMetrics: policy.initialMetrics(),
                    },
                );

                expect(newMetrics).toEqual({
                    samples: [
                        {
                            startedAt: recentSampleStart,
                            failures: 5,
                            successes: 5,
                        },
                        {
                            startedAt: currentDate.getTime(),
                            failures: 0,
                            successes: 1,
                        },
                    ],
                } satisfies SamplingBreakerMetrics);
            });
        });
        describe("method: isEqual", () => {
            test(`Should return true when given "samples" fields that are empty`, () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const isMatching = policy.isEqual(
                    {
                        samples: [],
                    },
                    {
                        samples: [],
                    },
                );

                expect(isMatching).toBe(true);
            });
            test("Should return true when samples have the same data", () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const isMatching = policy.isEqual(
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                );

                expect(isMatching).toBe(true);
            });
            test("Should return true when samples have the same data but different order", () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const isMatching = policy.isEqual(
                    {
                        samples: [
                            {
                                startedAt: 2000,
                                failures: 1,
                                successes: 1,
                            },
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                            {
                                startedAt: 2000,
                                failures: 1,
                                successes: 1,
                            },
                        ],
                    },
                );

                expect(isMatching).toBe(true);
            });
            test("Should return false when samples have different failures", () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const isMatching = policy.isEqual(
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 4,
                                successes: 3,
                            },
                        ],
                    },
                );

                expect(isMatching).toBe(false);
            });
            test("Should return false when samples have different successes", () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const isMatching = policy.isEqual(
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 5,
                            },
                        ],
                    },
                );

                expect(isMatching).toBe(false);
            });
            test("Should return false when samples have different lengths", () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const isMatching = policy.isEqual(
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                            {
                                startedAt: 2000,
                                failures: 1,
                                successes: 1,
                            },
                        ],
                    },
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                );

                expect(isMatching).toBe(false);
            });
            test("Should return false when samples have different startedAt", () => {
                const policy = new SamplingBreaker({
                    failureThreshold: 0.5,
                    minimumRps: 1,
                    timeSpan: TimeSpan.fromSeconds(10),
                });

                const isMatching = policy.isEqual(
                    {
                        samples: [
                            {
                                startedAt: 1000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                    {
                        samples: [
                            {
                                startedAt: 2000,
                                failures: 2,
                                successes: 3,
                            },
                        ],
                    },
                );

                expect(isMatching).toBe(false);
            });
        });
    },
);
