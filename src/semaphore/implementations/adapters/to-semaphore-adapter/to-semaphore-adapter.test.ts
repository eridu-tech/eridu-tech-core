import { beforeEach, describe, expect, test } from "vitest";

import { ToSemaphoreAdapter } from "@/semaphore/implementations/adapters/to-semaphore-adapter/to-semaphore-adapter.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { MemorySharedLockAdapter } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module-exports.js";

describe(
    "class: ToSemaphoreAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "Lock"] },
    () => {
        semaphoreAdapterTestSuite({
            createAdapter: () =>
                new ToSemaphoreAdapter(new MemorySharedLockAdapter()),
            test,
            beforeEach,
            expect,
            describe,
        });
    },
);
