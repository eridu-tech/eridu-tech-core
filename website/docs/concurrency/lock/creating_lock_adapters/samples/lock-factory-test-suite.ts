import { beforeEach, describe, expect, test } from "vitest";
import { lockFactoryTestSuite } from "eridu-tech/lock/test-utilities";
import { LockFactory } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

describe("class: MyLockFactory", () => {
    lockFactoryTestSuite({
        createLockFactory: () => ({
            lockFactory: new LockFactory({
                adapter: new MemoryLockAdapter(),
            }),
            serde: new SuperJsonSerde(),
        }),
        test,
        beforeEach,
        expect,
        describe,
    });
});
