/**
 * @module SharedLock
 */
import { SHARED_LOCK_STATE } from "@/shared-lock/contracts/_module-exports.js";
import { createIsTimeSpanEqualityTester } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type {
    ISharedLock,
    ISharedLockExpiredState,
    ISharedLockFactory,
    ISharedLockReaderAcquiredState,
    ISharedLockReaderLimitReachedState,
    ISharedLockReaderUnacquiredState,
    ISharedLockWriterAcquiredState,
    ISharedLockWriterUnavailableState,
} from "@/shared-lock/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/test-utilities"`
 * @group Utilities
 */
export type SharedLockFactorySerdeTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createSharedLockFactory: () => Promisable<{
        sharedLockFactory: ISharedLockFactory;
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
 * The `sharedLockFactorySerdeTestSuite` function simplifies the process of testing the serde behavior of your custom implementation of {@link ISharedLockFactory | `ISharedLockFactory`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/test-utilities"`
 * @group Utilities
 */
export function sharedLockFactorySerdeTestSuite(
    settings: SharedLockFactorySerdeTestSuiteSettings,
): void {
    const {
        expect,
        test,
        describe,
        createSharedLockFactory,
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        timeSpanEqualityBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;

    let sharedLockFactory: ISharedLockFactory;
    let serde: ISerde;

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    describe("ISharedLockFactory serde tests:", () => {
        beforeEach_(async () => {
            const { sharedLockFactory: sharedLockFactory_, serde: serde_ } =
                await createSharedLockFactory();
            sharedLockFactory = sharedLockFactory_;
            serde = serde_;
        });
        test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and key doesnt exists", async () => {
            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);
            const limit = 4;

            const sharedLock = sharedLockFactory.create(key, {
                ttl,
                limit,
            });
            const deserializedSharedLock = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock),
            );
            const result = await deserializedSharedLock.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and key is expired", async () => {
            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);
            const limit = 4;

            const sharedLock = sharedLockFactory.create(key, {
                ttl,
                limit,
            });
            await sharedLock.acquireWriter();
            await delayWithBuffer(ttl);

            const deserializedSharedLock = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock),
            );
            const result = await deserializedSharedLock.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and all key is released with forceRelease method", async () => {
            const key = "a";
            const limit = 4;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireWriter();

            const ttl2 = null;
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            await sharedLock2.acquireWriter();

            await sharedLock2.forceRelease();

            const deserializedSharedLock1 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock1),
            );
            const result = await deserializedSharedLock1.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and all key is released with forceRelease method", async () => {
            const key = "a";
            const limit = 4;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireWriter();

            const ttl2 = null;
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            await sharedLock2.acquireWriter();

            await sharedLock2.forceRelease();

            const deserializedSharedLock1 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock1),
            );
            const result = await deserializedSharedLock1.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockExpiredState when acquired as writer, is derserialized and all key is released with releaseWriter method", async () => {
            const key = "a";
            const limit = 4;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireWriter();

            const ttl2 = null;
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            await sharedLock2.acquireWriter();

            await sharedLock1.releaseWriter();
            await sharedLock2.releaseWriter();

            const deserializedSharedLock2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );
            const result = await deserializedSharedLock2.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockWriterAcquiredState when acquired as writer, is derserialized and key is unexpireable", async () => {
            const key = "a";
            const ttl = null;
            const limit = 4;

            const sharedLock = sharedLockFactory.create(key, {
                ttl,
                limit,
            });
            await sharedLock.acquireWriter();

            const deserializedSharedLock = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock),
            );
            const state = await deserializedSharedLock.getState();

            expect(state).toEqual({
                type: SHARED_LOCK_STATE.WRITER_ACQUIRED,
                remainingTime: ttl,
            } satisfies ISharedLockWriterAcquiredState);
        });
        test("Should return ISharedLockWriterAcquiredState when acquired as writer, is derserialized and key is unexpired", async () => {
            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);
            const limit = 4;

            const sharedLock = sharedLockFactory.create(key, {
                ttl,
                limit,
            });
            await sharedLock.acquireWriter();

            const deserializedSharedLock = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock),
            );
            const state = await deserializedSharedLock.getState();

            const writerAcquiredState = state as ISharedLockWriterAcquiredState;

            expect(state.type).toBe(SHARED_LOCK_STATE.WRITER_ACQUIRED);
            expect(
                writerAcquiredState.remainingTime?.toMilliseconds(),
            ).toBeLessThan(
                (writerAcquiredState.remainingTime?.toMilliseconds() ?? 0) + 10,
            );
            expect(
                writerAcquiredState.remainingTime?.toMilliseconds(),
            ).toBeGreaterThan(
                (writerAcquiredState.remainingTime?.toMilliseconds() ?? 0) - 10,
            );
        });
        test("Should return ISharedLockWriterUnavailableState when acquired as writer, is derserialized and key is acquired by different shared-lock-id", async () => {
            const key = "a";
            const ttl = null;
            const limit = 4;

            const sharedLock1 = sharedLockFactory.create(key, {
                ttl,
                limit,
            });
            await sharedLock1.acquireWriter();

            const sharedLock2 = sharedLockFactory.create(key, {
                ttl,
                limit,
            });
            const deserializedSharedLock2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );
            const state = await deserializedSharedLock2.getState();

            expect(state).toEqual({
                type: SHARED_LOCK_STATE.WRITER_UNAVAILABLE,
                owner: sharedLock1.id,
            } satisfies ISharedLockWriterUnavailableState);
        });
        test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and key doesnt exists", async () => {
            const key = "a";
            const limit = 3;
            const ttl = TimeSpan.fromMilliseconds(50);

            const sharedLock = sharedLockFactory.create(key, {
                limit,
                ttl,
            });
            const deserializedSemaphore = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock),
            );

            const result = await deserializedSemaphore.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and key is expired", async () => {
            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);
            const limit = 2;

            const sharedLock = sharedLockFactory.create(key, {
                ttl,
                limit,
            });
            const deserializedSemaphore = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock),
            );
            await deserializedSemaphore.acquireReader();
            await delayWithBuffer(ttl);

            const result = await sharedLock.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and all shared-lock-slots are released with forceRelease method", async () => {
            const key = "a";
            const limit = 2;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireReader();

            const ttl2 = null;
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );
            await deserializedSemaphore2.acquireReader();

            await deserializedSemaphore2.forceRelease();

            const result = await sharedLock1.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockExpiredState when acquired as reader, is derserialized and all shared-lock-slots are released with release method", async () => {
            const key = "a";
            const limit = 2;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                limit,
                ttl: ttl1,
            });
            await sharedLock1.acquireReader();

            const ttl2 = null;
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserialziedSemaphore2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );
            await deserialziedSemaphore2.acquireReader();

            await sharedLock1.releaseReader();
            await deserialziedSemaphore2.releaseReader();

            const result = await deserialziedSemaphore2.getState();

            expect(result).toEqual({
                type: SHARED_LOCK_STATE.EXPIRED,
            } satisfies ISharedLockExpiredState);
        });
        test("Should return ISharedLockReaderUnacquiredState when acquired as reader, is derserialized and shared-lock-slot is unacquired", async () => {
            const key = "a";
            const limit = 3;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireReader();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserialziedSemaphore2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );

            const state = await deserialziedSemaphore2.getState();

            expect(state).toEqual({
                type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                limit,
                freeSlotsCount: limit - 1,
                acquiredSlotsCount: 1,
                acquiredSlots: [sharedLock1.id],
            } satisfies ISharedLockReaderUnacquiredState);
        });
        test("Should return ISharedLockReaderUnacquiredState when acquired as reader, is derserialized and shared-lock-slot is expired", async () => {
            const key = "a";
            const limit = 3;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireReader();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );
            await deserializedSemaphore2.acquireReader();
            await delayWithBuffer(ttl2);

            const state = await deserializedSemaphore2.getState();

            expect(state).toEqual({
                type: SHARED_LOCK_STATE.READER_UNACQUIRED,
                limit,
                freeSlotsCount: limit - 1,
                acquiredSlotsCount: 1,
                acquiredSlots: [sharedLock1.id],
            } satisfies ISharedLockReaderUnacquiredState);
        });
        test("Should return ISharedLockReaderAcquiredState when acquired as reader, is derserialized and shared-lock-slot is unexpired", async () => {
            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
            ]);

            const key = "a";
            const limit = 3;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireReader();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );
            await deserializedSemaphore2.acquireReader();

            const state = await deserializedSemaphore2.getState();

            expect(state).toEqual({
                type: SHARED_LOCK_STATE.READER_ACQUIRED,
                limit,
                freeSlotsCount: limit - 2,
                acquiredSlotsCount: 2,
                acquiredSlots: [sharedLock1.id, sharedLock2.id],
                remainingTime: ttl2,
            } satisfies ISharedLockReaderAcquiredState);
        });
        test("Should return ISharedLockReaderLimitReachedState when acquired as reader, is derserialized and limit is reached", async () => {
            const key = "a";
            const limit = 1;

            const ttl1 = null;
            const sharedLock1 = sharedLockFactory.create(key, {
                ttl: ttl1,
                limit,
            });
            await sharedLock1.acquireReader();

            const ttl2 = TimeSpan.fromMilliseconds(50);
            const sharedLock2 = sharedLockFactory.create(key, {
                ttl: ttl2,
                limit,
            });
            const deserializedSemaphore2 = serde.deserialize<ISharedLock>(
                serde.serialize(sharedLock2),
            );
            await delayWithBuffer(ttl2);

            const state = await deserializedSemaphore2.getState();

            expect(state).toEqual({
                type: SHARED_LOCK_STATE.READER_LIMIT_REACHED,
                limit,
                acquiredSlots: [sharedLock1.id],
            } satisfies ISharedLockReaderLimitReachedState);
        });
    });
}
