import { beforeEach, describe, expect, test } from "vitest";
import { semaphoreFactoryTestSuite } from "eridu-tech/semaphore/test-utilities";
import { SemaphoreFactory } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

describe("class: MySemaphoreFactory", () => {
    semaphoreFactoryTestSuite({
        createSemaphoreFactory: () => ({
            semaphoreFactory: new SemaphoreFactory({
                adapter: new MemorySemaphoreAdapter(),
            }),
            serde: new SuperJsonSerde(),
        }),
        test,
        beforeEach,
        expect,
        describe,
    });
});
