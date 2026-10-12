import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";

export const memoryFileStorageAdapter = new SignedFileStorageAdapter({
    adapter: new MemoryFileStorageAdapter(),
    urlAdapter: {},
});
