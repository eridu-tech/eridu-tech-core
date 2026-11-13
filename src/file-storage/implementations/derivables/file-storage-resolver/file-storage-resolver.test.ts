import { beforeEach, describe, expect, test, vi } from "vitest";

import { MemoryFileStorageAdapter } from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module-exports.js";
import { SignedFileStorageAdapter } from "@/file-storage/implementations/adapters/signed-file-storage-adapter/_module-exports.js";
import { NoOpFileUrlAdapter } from "@/file-storage/implementations/adapters/signed-file-storage-adapter/no-op-file-url-adapter.js";
import {
    FileStorage,
    FileStorageResolver,
} from "@/file-storage/implementations/derivables/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

describe("class: FileStorageResolver", () => {
    type Adapters = "adapter1" | "adapter2" | "adapter3";
    let resolver: FileStorageResolver<Adapters>;
    let adapter1: SignedFileStorageAdapter;
    let adapter2: SignedFileStorageAdapter;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        adapter1 = new SignedFileStorageAdapter({
            adapter: new MemoryFileStorageAdapter(),
            urlAdapter: new NoOpFileUrlAdapter(),
        });
        adapter2 = new SignedFileStorageAdapter({
            adapter: new MemoryFileStorageAdapter(),
            urlAdapter: new NoOpFileUrlAdapter(),
        });
        resolver = new FileStorageResolver<Adapters>({
            adapters: {
                adapter1,
                adapter2,
            },
            defaultAdapter: "adapter1",
        });
        resolver.init();
    });

    describe("Method: use", () => {
        test("Should throw DefaultAdapterNotDefinedError when called without arguments and no default adapter is configured", () => {
            const resolverWithoutDefaultAdapter =
                new FileStorageResolver<Adapters>({
                    adapters: {
                        adapter1,
                        adapter2,
                    },
                });

            expect(() => {
                resolverWithoutDefaultAdapter.use();
            }).toThrow(DefaultAdapterNotDefinedError);
        });

        test("Should throw UnregisteredAdapterError when called with an adapter name that is not registered", () => {
            expect(() => {
                resolver.use("adapter3");
            }).toThrow(UnregisteredAdapterError);
        });

        test("Should return the file storage of the registered adapter when called with its name", () => {
            expect(resolver.use("adapter1")).toBeInstanceOf(FileStorage);
            expect(resolver.use("adapter2")).not.toBe(resolver.use("adapter1"));
        });

        test("Should call the default adapter when called without arguments", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "exists");
            const adapter2Spy = vi.spyOn(adapter2, "exists");

            await resolver.use().create("key").exists();

            expect(adapter1Spy).toHaveBeenCalledOnce();
            expect(adapter2Spy).not.toHaveBeenCalled();
        });

        test("Should call the explicitly selected adapter when called with its name", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "exists");
            const adapter2Spy = vi.spyOn(adapter2, "exists");

            await resolver.use("adapter2").create("key").exists();

            expect(adapter2Spy).toHaveBeenCalledOnce();
            expect(adapter1Spy).not.toHaveBeenCalled();
        });
    });
});
