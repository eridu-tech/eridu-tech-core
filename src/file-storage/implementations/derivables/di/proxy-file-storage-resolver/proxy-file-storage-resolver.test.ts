import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { MemoryFileStorageAdapter } from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module-exports.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/no-op-file-storage-adapter.js";
import { SignedFileStorageAdapter } from "@/file-storage/implementations/adapters/signed-file-storage-adapter/_module-exports.js";
import { FileStorageResolver } from "@/file-storage/implementations/derivables/_module-exports.js";
import { ProxyFileStorageResolver } from "@/file-storage/implementations/derivables/di/proxy-file-storage-resolver/proxy-file-storage-resolver.js";
import { fileStorageSerdeTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module-exports.js";
import { Serde } from "@/serde/implementations/derivables/_module-exports.js";

import type { Mock } from "vitest";

import type {
    IFileStorage,
    IFileStorageResolver,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module-exports.js";

describe("class: ProxyFileStorageResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let fileStorage: IFileStorageResolver<Adapters> & IFileStorage;
    let container: Container;
    let exists1: Mock<ISignedFileStorageAdapter["exists"]>;
    let exists2: Mock<ISignedFileStorageAdapter["exists"]>;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpFileStorageAdapter();
            exists1 = vi.spyOn(adapter1, "exists");

            const adapter2 = new NoOpFileStorageAdapter();
            exists2 = vi.spyOn(adapter2, "exists");

            container.registerFactory({
                token: FileStorageResolver,
                factory: () => {
                    return new FileStorageResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            fileStorage = new ProxyFileStorageResolver<Adapters>(
                container,
                FileStorageResolver,
            );

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await fileStorage.create(key).exists();

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await fileStorage.use("adapter1").create(key).exists();

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await fileStorage.use("adapter2").create(key).exists();

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists1).not.toHaveBeenCalled();
        });

        fileStorageSerdeTestSuite({
            createFileStorage: async () => {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                const serdeContainer = new Container({
                    executionContext,
                });
                const fileStorageResolver = new FileStorageResolver<Adapters>({
                    adapters: {
                        adapter1: new SignedFileStorageAdapter({
                            adapter: new MemoryFileStorageAdapter(),
                            urlAdapter: {},
                        }),
                        adapter2: new SignedFileStorageAdapter({
                            adapter: new MemoryFileStorageAdapter(),
                            urlAdapter: {},
                        }),
                    },
                    defaultAdapter: "adapter1",
                    serde,
                });
                serdeContainer.registerFactory({
                    token: FileStorageResolver,
                    factory: () => {
                        return fileStorageResolver;
                    },
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });
                const fileStorage_ = new ProxyFileStorageResolver<Adapters>(
                    serdeContainer,
                    FileStorageResolver,
                );
                await serdeContainer.init();
                return {
                    fileStorage: fileStorage_,
                    serde,
                };
            },
            beforeEach,
            describe,
            expect,
            test,
        });
    });
    describe("LIFETIME.TRANSIENT:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpFileStorageAdapter();
            exists1 = vi.spyOn(adapter1, "exists");

            const adapter2 = new NoOpFileStorageAdapter();
            exists2 = vi.spyOn(adapter2, "exists");

            container.registerFactory({
                token: FileStorageResolver,
                factory: () => {
                    return new FileStorageResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                },
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            fileStorage = new ProxyFileStorageResolver<Adapters>(
                container,
                FileStorageResolver,
            );

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await fileStorage.create(key).exists();

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await fileStorage.use("adapter1").create(key).exists();

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await fileStorage.use("adapter2").create(key).exists();

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists1).not.toHaveBeenCalled();
        });

        fileStorageSerdeTestSuite({
            createFileStorage: async () => {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                const serdeContainer = new Container({
                    executionContext,
                });
                const fileStorageResolver = new FileStorageResolver<Adapters>({
                    adapters: {
                        adapter1: new SignedFileStorageAdapter({
                            adapter: new MemoryFileStorageAdapter(),
                            urlAdapter: {},
                        }),
                        adapter2: new SignedFileStorageAdapter({
                            adapter: new MemoryFileStorageAdapter(),
                            urlAdapter: {},
                        }),
                    },
                    defaultAdapter: "adapter1",
                    serde,
                });
                serdeContainer.registerFactory({
                    token: FileStorageResolver,
                    factory: () => {
                        return fileStorageResolver;
                    },
                    deps: {},
                    lifetime: LIFETIME.TRANSIENT,
                });
                const fileStorage_ = new ProxyFileStorageResolver<Adapters>(
                    serdeContainer,
                    FileStorageResolver,
                );
                await serdeContainer.init();
                return {
                    fileStorage: fileStorage_,
                    serde,
                };
            },
            beforeEach,
            describe,
            expect,
            test,
        });
    });
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpFileStorageAdapter();
            exists1 = vi.spyOn(adapter1, "exists");

            const adapter2 = new NoOpFileStorageAdapter();
            exists2 = vi.spyOn(adapter2, "exists");

            container.registerFactory({
                token: FileStorageResolver,
                factory: () => {
                    return new FileStorageResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            fileStorage = new ProxyFileStorageResolver<Adapters>(
                container,
                FileStorageResolver,
            );

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await fileStorage.create(key).exists();
                },
            });

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await fileStorage.use("adapter1").create(key).exists();
                },
            });

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await fileStorage.use("adapter2").create(key).exists();
                },
            });

            const args: Parameters<ISignedFileStorageAdapter["exists"]> = [key];

            expect(exists2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(exists1).not.toHaveBeenCalled();
        });

        fileStorageSerdeTestSuite({
            createFileStorage: async () => {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                const serdeContainer = new Container({
                    executionContext,
                });
                const fileStorageResolver = new FileStorageResolver<Adapters>({
                    adapters: {
                        adapter1: new SignedFileStorageAdapter({
                            adapter: new MemoryFileStorageAdapter(),
                            urlAdapter: {},
                        }),
                        adapter2: new SignedFileStorageAdapter({
                            adapter: new MemoryFileStorageAdapter(),
                            urlAdapter: {},
                        }),
                    },
                    defaultAdapter: "adapter1",
                    serde,
                });
                serdeContainer.registerFactory({
                    token: FileStorageResolver,
                    factory: () => {
                        return fileStorageResolver;
                    },
                    deps: {},
                    lifetime: LIFETIME.SCOPED,
                });
                const fileStorage_ = new ProxyFileStorageResolver<Adapters>(
                    serdeContainer,
                    FileStorageResolver,
                );
                await serdeContainer.init();
                return {
                    fileStorage: fileStorage_,
                    serde,
                };
            },
            beforeEach,
            describe,
            expect,
            test,
        });
    });
});
