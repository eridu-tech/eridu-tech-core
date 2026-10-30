import { beforeEach, describe, expect, test } from "vitest";
import { sharedLockFactoryTestSuite } from "eridu-tech/shared-lock/test-utilities";
import { SharedLockFactory } from "eridu-tech/shared-lock";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

describe("class: SharedLockFactory", () => {
    sharedLockFactoryTestSuite({
        createSharedLockFactory: () => ({
            sharedLockFactory: new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
            }),
            serde: new SuperJsonSerde(),
        }),
        test,
        beforeEach,
        expect,
        describe,
    });
});
