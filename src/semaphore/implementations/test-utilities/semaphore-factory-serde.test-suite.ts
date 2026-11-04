/**
 * @module Semaphore
 */
import { SEMAPHORE_STATE } from "@/semaphore/contracts/_module-exports.js";
import { createIsTimeSpanEqualityTester } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type {
    ISemaphore,
    ISemaphoreAcquiredState,
    ISemaphoreExpiredState,
    ISemaphoreFactory,
    ISemaphoreLimitReachedState,
    ISemaphoreUnacquiredState,
} from "@/semaphore/contracts/_module-exports.js";
import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/test-utilities"`
 * @group Utilities
 */
export type SemaphoreFactorySerdeTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createSemaphoreFactory: () => Promisable<{
        semaphoreFactory: ISemaphoreFactory;
        serde: ISerde;
    }>;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    delayBuffer?: ITimeSpan;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMilliseconds(10)
     * ```
     */
    timeSpanEqualityBuffer?: ITimeSpan;
};

/**
 * The `semaphoreFactorySerdeTestSuite` function simplifies the process of testing the serde behavior of your custom implementation of {@link ISemaphoreFactory | `ISemaphoreFactory`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/test-utilities"`
 * @group Utilities
 */
export function semaphoreFactorySerdeTestSuite(
    settings: SemaphoreFactorySerdeTestSuiteSettings,
): void {
    const {
        expect,
        test,
        describe,
        createSemaphoreFactory,
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        timeSpanEqualityBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;

    let semaphoreFactory: ISemaphoreFactory;
    let serde: ISerde;

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    describe("ISemaphoreFactory serde tests:", () => {
        beforeEach_(async () => {
            const { semaphoreFactory: semaphoreFactory_, serde: serde_ } =
                await createSemaphoreFactory();
            semaphoreFactory = semaphoreFactory_;
            serde = serde_;
        });
        test("Should return ISemaphoreExpiredState when is derserialized and key doesnt exists", async () => {
            const key = "a";
            const limit = 3;
            const ttl = TimeSpan.fromMilliseconds(50);

            const semaphore = semaphoreFactory.create(key, {
                limit,
                ttl,
            });
            const deserializedSemaphore = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore),
            );

            const result = await deserializedSemaphore.getState();

            expect(result).toEqual({
                type: SEMAPHORE_STATE.EXPIRED,
            } satisfies ISemaphoreExpiredState);
        });
        test("Should return ISemaphoreExpiredState when is derserialized and key is expired", async () => {
            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);
            const limit = 2;

            const semaphore = semaphoreFactory.create(key, {
                ttl,
                limit,
            });
            const deserializedSemaphore = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore),
            );
            await deserializedSemaphore.acquire();
            await delayWithBuffer(ttl);

            const result = await semaphore.getState();

            expect(result).toEqual({
                type: SEMAPHORE_STATE.EXPIRED,
            } satisfies ISemaphoreExpiredState);
        });
        test("Should return ISemaphoreExpiredState when is derserialized and all slots are released with forceReleaseAll method", async () => {
            const key = "a";
            const limit = 2;

            const ttl1 = null;
            const semaphore1 = semaphoreFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await semaphore1.acquire();

            const ttl2 = null;
            const semaphore2 = semaphoreFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore2),
            );
            await deserializedSemaphore2.acquire();

            await deserializedSemaphore2.forceReleaseAll();

            const result = await semaphore1.getState();

            expect(result).toEqual({
                type: SEMAPHORE_STATE.EXPIRED,
            } satisfies ISemaphoreExpiredState);
        });
        test("Should return ISemaphoreExpiredState when is derserialized and all slots are released with release method", async () => {
            const key = "a";
            const limit = 2;

            const ttl1 = null;
            const semaphore1 = semaphoreFactory.create(key, {
                limit,
                ttl: ttl1,
            });
            await semaphore1.acquire();

            const ttl2 = null;
            const semaphore2 = semaphoreFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserialziedSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore2),
            );
            await deserialziedSemaphore2.acquire();

            await semaphore1.release();
            await deserialziedSemaphore2.release();

            const result = await deserialziedSemaphore2.getState();

            expect(result).toEqual({
                type: SEMAPHORE_STATE.EXPIRED,
            } satisfies ISemaphoreExpiredState);
        });
        test("Should return ISemaphoreUnacquiredState when is derserialized and slot is unacquired", async () => {
            const key = "a";
            const limit = 3;

            const ttl1 = null;
            const semaphore1 = semaphoreFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await semaphore1.acquire();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const semaphore2 = semaphoreFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserialziedSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore2),
            );

            const state = await deserialziedSemaphore2.getState();

            expect(state).toEqual({
                type: SEMAPHORE_STATE.UNACQUIRED,
                limit,
                freeSlotsCount: limit - 1,
                acquiredSlotsCount: 1,
                acquiredSlots: [semaphore1.id],
            } satisfies ISemaphoreUnacquiredState);
        });
        test("Should return ISemaphoreUnacquiredState when is derserialized and slot is expired", async () => {
            const key = "a";
            const limit = 3;

            const ttl1 = null;
            const semaphore1 = semaphoreFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await semaphore1.acquire();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const semaphore2 = semaphoreFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore2),
            );
            await deserializedSemaphore2.acquire();
            await delayWithBuffer(ttl2);

            const state = await deserializedSemaphore2.getState();

            expect(state).toEqual({
                type: SEMAPHORE_STATE.UNACQUIRED,
                limit,
                freeSlotsCount: limit - 1,
                acquiredSlotsCount: 1,
                acquiredSlots: [semaphore1.id],
            } satisfies ISemaphoreUnacquiredState);
        });
        test("Should return ISemaphoreAcquiredState when is derserialized and slot is unexpired", async () => {
            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
            ]);

            const key = "a";
            const limit = 3;

            const ttl1 = null;
            const semaphore1 = semaphoreFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await semaphore1.acquire();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const semaphore2 = semaphoreFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore2),
            );
            await deserializedSemaphore2.acquire();

            const state = await deserializedSemaphore2.getState();

            expect(state).toEqual({
                type: SEMAPHORE_STATE.ACQUIRED,
                limit,
                freeSlotsCount: limit - 2,
                acquiredSlotsCount: 2,
                acquiredSlots: [semaphore1.id, semaphore2.id],
                remainingTime: ttl2,
            } satisfies ISemaphoreAcquiredState);
        });
        test("Should return ISemaphoreLimitReachedState when is derserialized and limit is reached", async () => {
            const key = "a";
            const limit = 1;

            const ttl1 = null;
            const semaphore1 = semaphoreFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await semaphore1.acquire();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const semaphore2 = semaphoreFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(semaphore2),
            );
            await delayWithBuffer(ttl2);

            const state = await deserializedSemaphore2.getState();

            expect(state).toEqual({
                type: SEMAPHORE_STATE.LIMIT_REACHED,
                limit,
                acquiredSlots: [semaphore1.id],
            } satisfies ISemaphoreLimitReachedState);
        });
    });
}
