import { beforeEach, describe, expect, test, vi } from "vitest";

import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { MemorySemaphoreAdapter } from "@/semaphore/implementations/adapters/memory-semaphore-adapter/_module-exports.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/no-op-semaphore-adapter/no-op-semaphore-adapter.js";
import { SemaphoreFactoryResolver } from "@/semaphore/implementations/derivables/_module-exports.js";
import { semaphoreFactoryResolverDiFactory } from "@/semaphore/implementations/derivables/di/semaphore-factory-resolver-di-factory/semaphore-factory-resolver-di-factory.js";
import { semaphoreFactorySerdeTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module-exports.js";
import { Serde } from "@/serde/implementations/derivables/_module-exports.js";

import type { Mock } from "vitest";

import type {
    ISemaphoreAdapter,
    ISemaphoreFactory,
    ISemaphoreFactoryResolver,
} from "@/semaphore/contracts/_module-exports.js";

describe("function: semaphoreFactoryResolverDiFactory", () => {
    type Adapters = "adapter1" | "adapter2";
    let semaphoreFactory: ISemaphoreFactoryResolver<Adapters> &
        ISemaphoreFactory;
    let acquire1: Mock<ISemaphoreAdapter["acquire"]>;
    let acquire2: Mock<ISemaphoreAdapter["acquire"]>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        const adapter1 = new NoOpSemaphoreAdapter();
        acquire1 = vi.spyOn(adapter1, "acquire");

        const adapter2 = new NoOpSemaphoreAdapter();
        acquire2 = vi.spyOn(adapter2, "acquire");

        const semaphoreFactoryResolver = new SemaphoreFactoryResolver<Adapters>(
            {
                adapters: {
                    adapter1,
                    adapter2,
                },
                defaultAdapter: "adapter1",
            },
        );
        container.registerValue({
            token: SemaphoreFactoryResolver,
            value: semaphoreFactoryResolver,
        });
        semaphoreFactory = semaphoreFactoryResolverDiFactory<Adapters>(
            container,
            SemaphoreFactoryResolver,
        );

        await container.init();
    });

    test("Default adapter:", async () => {
        const key = "a";
        const slotId = "1";
        const limit = 2;
        await semaphoreFactory
            .create(key, { limit, slotId, ttl: null })
            .acquire();

        const args: Parameters<ISemaphoreAdapter["acquire"]> = [
            {
                key,
                slotId,
                limit,
                ttl: null,
            },
        ];

        expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
        expect(acquire2).not.toHaveBeenCalled();
    });
    test("Adapter 1:", async () => {
        const key = "a";
        const slotId = "1";
        const limit = 2;
        await semaphoreFactory
            .use("adapter1")
            .create(key, { limit, slotId, ttl: null })
            .acquire();

        const args: Parameters<ISemaphoreAdapter["acquire"]> = [
            {
                key,
                slotId,
                limit,
                ttl: null,
            },
        ];

        expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
        expect(acquire2).not.toHaveBeenCalled();
    });
    test("Adapter 2:", async () => {
        const key = "a";
        const slotId = "1";
        const limit = 2;
        await semaphoreFactory
            .use("adapter2")
            .create(key, { limit, slotId, ttl: null })
            .acquire();

        const args: Parameters<ISemaphoreAdapter["acquire"]> = [
            {
                key,
                slotId,
                limit,
                ttl: null,
            },
        ];

        expect(acquire2).toHaveBeenCalledExactlyOnceWith(...args);
        expect(acquire1).not.toHaveBeenCalled();
    });

    semaphoreFactorySerdeTestSuite({
        createSemaphoreFactory: async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const container = new Container({
                executionContext,
            });
            const semaphoreFactoryResolver =
                new SemaphoreFactoryResolver<Adapters>({
                    adapters: {
                        adapter1: new MemorySemaphoreAdapter(),
                        adapter2: new MemorySemaphoreAdapter(),
                    },
                    defaultAdapter: "adapter1",
                    serde,
                });
            container.registerValue({
                token: SemaphoreFactoryResolver,
                value: semaphoreFactoryResolver,
            });
            const semaphoreFactory_ =
                semaphoreFactoryResolverDiFactory<Adapters>(
                    container,
                    SemaphoreFactoryResolver,
                );
            await container.init();
            return {
                semaphoreFactory: semaphoreFactory_,
                serde,
            };
        },
        beforeEach,
        describe,
        expect,
        test,
    });
});
