import { beforeEach, describe, expect, test, vi } from "vitest";

import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/no-op-file-storage-adapter.js";
import { FileStorageResolver } from "@/file-storage/implementations/derivables/_module-exports.js";
import { fileStorageResolverDiFactory } from "@/file-storage/implementations/derivables/di/file-storage-resolver-di-factory/file-storage-resolver-di-factory.js";

import type { Mock } from "vitest";

import type {
    IFileStorage,
    IFileStorageResolver,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module-exports.js";

describe("function: fileStorageResolverDiFactory", () => {
    type Adapters = "adapter1" | "adapter2";
    let fileStorage: IFileStorageResolver<Adapters> & IFileStorage;
    let exists1: Mock<ISignedFileStorageAdapter["exists"]>;
    let exists2: Mock<ISignedFileStorageAdapter["exists"]>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        const adapter1 = new NoOpFileStorageAdapter();
        exists1 = vi.spyOn(adapter1, "exists");

        const adapter2 = new NoOpFileStorageAdapter();
        exists2 = vi.spyOn(adapter2, "exists");

        const fileStorageResolver = new FileStorageResolver<Adapters>({
            adapters: {
                adapter1,
                adapter2,
            },
            defaultAdapter: "adapter1",
        });
        container.registerValue({
            token: FileStorageResolver,
            value: fileStorageResolver,
        });
        fileStorage = fileStorageResolverDiFactory<Adapters>(
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
});
