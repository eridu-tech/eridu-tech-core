import { beforeEach, describe, expect, test } from "vitest";

import { ToLockAdapter } from "@/lock/implementations/adapters/to-lock-adapter/to-lock-adapter.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module-exports.js";
import { MemorySharedLockAdapter } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module-exports.js";

describe(
    "class: ToLockAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "Lock"] },
    () => {
        lockAdapterTestSuite({
            createAdapter: () =>
                new ToLockAdapter(new MemorySharedLockAdapter()),
            test,
            beforeEach,
            expect,
            describe,
        });
    },
);
