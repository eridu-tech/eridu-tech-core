---
"eridu-tech": minor
---

Extracted the serde conformance tests out of the lock, semaphore, shared lock and file storage test suites into dedicated serde test-suite functions, so the serde behaviour can be exercised on its own or alongside the existing suite.

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { LockFactory } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import {
    lockFactorySerdeTestSuite,
    lockFactoryTestSuite,
} from "eridu-tech/lock/test-utilities";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

describe("class: MyLockFactory", () => {
    const createLockFactory = () => {
        const serde = new Serde(new SuperJsonSerdeAdapter());
        const lockFactory = new LockFactory({
            serde,
            adapter: new MemoryLockAdapter(),
        });
        return { lockFactory, serde };
    };

    lockFactoryTestSuite({
        createLockFactory,
        beforeEach,
        describe,
        expect,
        test,
    });

    lockFactorySerdeTestSuite({
        createLockFactory,
        beforeEach,
        describe,
        expect,
        test,
    });
});
```

- `eridu-tech/lock/test-utilities` exports `lockFactorySerdeTestSuite` and `LockFactorySerdeTestSuiteSettings`.
- `eridu-tech/semaphore/test-utilities` exports `semaphoreFactorySerdeTestSuite` and `SemaphoreFactorySerdeTestSuiteSettings`.
- `eridu-tech/shared-lock/test-utilities` exports `sharedLockFactorySerdeTestSuite` and `SharedLockFactorySerdeTestSuiteSettings`.
- `eridu-tech/file-storage/test-utilities` exports `fileStorageSerdeTestSuite` and `FileStorageSerdeTestSuiteSettings`.

Each new function accepts the vitest `expect` / `test` / `describe` / `beforeEach` APIs plus the matching `create<Name>` callback, which returns the created instance together with the `serde` it was built with. It registers tests that serialize and deserialize the instance through that `serde` and assert its state afterwards.

### Breaking changes

- `lockFactoryTestSuite`, `semaphoreFactoryTestSuite`, `sharedLockFactoryTestSuite` and `fileStorageTestSuite` no longer register the serde tests.
- The `excludeSerdeTests` setting was removed from those four test suites.

### Migration

Call the matching serde test-suite next to the existing one, passing the same `create<Name>` callback, so the previous coverage is preserved (see the example above). Remove the `excludeSerdeTests` setting; omit the serde test-suite instead to skip those tests.
