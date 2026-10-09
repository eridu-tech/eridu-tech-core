/**
 * @module Lock
 */
import { LOCK_STATE } from "@/lock/contracts/_module-exports.js";
import { createIsTimeSpanEqualityTester } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type {
    ILock,
    ILockAcquiredState,
    ILockExpiredState,
    ILockFactory,
    ILockUnavailableState,
} from "@/lock/contracts/_module-exports.js";
import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/lock/test-utilities"`
 * @group Utilities
 */
export type LockFactorySerdeTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createLockFactory: () => Promisable<{
        lockFactory: ILockFactory;
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
 * The `lockFactorySerdeTestSuite` function simplifies the process of testing the serde behavior of your custom implementation of {@link ILockFactory | `ILockFactory`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/lock/test-utilities"`
 * @group Utilities
 */
export function lockFactorySerdeTestSuite(
    settings: LockFactorySerdeTestSuiteSettings,
): void {
    const {
        expect,
        test,
        describe,
        createLockFactory,
        beforeEach: beforeEach_,
        delayBuffer = TimeSpan.fromMilliseconds(10),
        timeSpanEqualityBuffer = TimeSpan.fromMilliseconds(10),
    } = settings;

    let lockFactory: ILockFactory;
    let serde: ISerde;

    async function delayWithBuffer(ttl: ITimeSpan): Promise<void> {
        await delay(TimeSpan.fromTimeSpan(ttl).addTimeSpan(delayBuffer));
    }

    describe("ILockFactory Serde tests:", () => {
        beforeEach_(async () => {
            const { lockFactory: lockFactory_, serde: serde_ } =
                await createLockFactory();
            lockFactory = lockFactory_;
            serde = serde_;
        });
        test("Should return ILockExpiredState when is derserialized and key doesnt exists", async () => {
            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);

            const lock = lockFactory.create(key, {
                ttl,
            });
            const deserializedLock = await serde.deserialize<ILock>(
                await serde.serialize(lock),
            );
            const result = await deserializedLock.getState();

            expect(result).toEqual({
                type: LOCK_STATE.EXPIRED,
            } satisfies ILockExpiredState);
        });
        test("Should return ILockExpiredState when is derserialized and key is expired", async () => {
            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);

            const lock = lockFactory.create(key, {
                ttl,
            });
            await lock.acquire();
            await delayWithBuffer(ttl);

            const deserializedLock = await serde.deserialize<ILock>(
                await serde.serialize(lock),
            );
            const result = await deserializedLock.getState();

            expect(result).toEqual({
                type: LOCK_STATE.EXPIRED,
            } satisfies ILockExpiredState);
        });
        test("Should return ILockExpiredState when is derserialized and all key is released with forceRelease method", async () => {
            const key = "a";

            const ttl1 = null;
            const lock1 = lockFactory.create(key, {
                ttl: ttl1,
            });
            await lock1.acquire();

            const ttl2 = null;
            const lock2 = lockFactory.create(key, {
                ttl: ttl2,
            });
            await lock2.acquire();

            await lock2.forceRelease();

            const deserializedLock1 = await serde.deserialize<ILock>(
                await serde.serialize(lock1),
            );
            const result = await deserializedLock1.getState();

            expect(result).toEqual({
                type: LOCK_STATE.EXPIRED,
            } satisfies ILockExpiredState);
        });
        test("Should return ILockExpiredState when is derserialized and all key is released with release method", async () => {
            const key = "a";

            const ttl1 = null;
            const lock1 = lockFactory.create(key, {
                ttl: ttl1,
            });
            await lock1.acquire();

            const ttl2 = null;
            const lock2 = lockFactory.create(key, {
                ttl: ttl2,
            });
            await lock2.acquire();

            await lock1.release();
            await lock2.release();

            const deserializedLock2 = await serde.deserialize<ILock>(
                await serde.serialize(lock2),
            );
            const result = await deserializedLock2.getState();

            expect(result).toEqual({
                type: LOCK_STATE.EXPIRED,
            } satisfies ILockExpiredState);
        });
        test("Should return ILockAcquiredState when is derserialized and key is unexpireable", async () => {
            const key = "a";
            const ttl = null;
            const lock = lockFactory.create(key, {
                ttl,
            });
            await lock.acquire();

            const deserializedLock = await serde.deserialize<ILock>(
                await serde.serialize(lock),
            );
            const state = await deserializedLock.getState();

            expect(state).toEqual({
                type: LOCK_STATE.ACQUIRED,
                remainingTime: ttl,
            } satisfies ILockAcquiredState);
        });
        test("Should return ILockAcquiredState when is derserialized and key is unexpired", async () => {
            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(timeSpanEqualityBuffer),
            ]);

            const key = "a";
            const ttl = TimeSpan.fromMilliseconds(50);
            const lock = lockFactory.create(key, {
                ttl,
            });
            await lock.acquire();

            const deserializedLock = await serde.deserialize<ILock>(
                await serde.serialize(lock),
            );
            const state = await deserializedLock.getState();

            expect(state).toEqual({
                type: LOCK_STATE.ACQUIRED,
                remainingTime: ttl,
            } satisfies ILockAcquiredState);
        });
        test("Should return ILockUnavailableState when is derserialized and key is acquired by different lock-id", async () => {
            const key = "a";
            const ttl = null;
            const lock1 = lockFactory.create(key, {
                ttl,
            });
            await lock1.acquire();

            const lock2 = lockFactory.create(key, {
                ttl,
            });
            const deserializedLock2 = await serde.deserialize<ILock>(
                await serde.serialize(lock2),
            );
            const state = await deserializedLock2.getState();

            expect(state).toEqual({
                type: LOCK_STATE.UNAVAILABLE,
                owner: lock1.id,
            } satisfies ILockUnavailableState);
        });
    });
}
