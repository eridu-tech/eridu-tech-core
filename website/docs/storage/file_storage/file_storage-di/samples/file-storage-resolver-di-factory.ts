import { FileStorageResolver } from "eridu-tech/file-storage";
import { ProxyFileStorageResolver } from "eridu-tech/file-storage/di";
import { container } from "./container.js";
import { fsFileStorageAdapter } from "./fs-file-storage-adapter.js";
import { memoryFileStorageAdapter } from "./memory-file-storage-adapter.js";

type Adapters = "memory" | "fs";

const fileStorageResolver = new FileStorageResolver<Adapters>({
    adapters: {
        memory: memoryFileStorageAdapter,
        fs: fsFileStorageAdapter,
    },
    defaultAdapter: "memory",
});

await fileStorageResolver.init();

container.registerValue({
    token: FileStorageResolver,
    value: fileStorageResolver,
});

// Create the proxy before container.init()
export const fileStorage = new ProxyFileStorageResolver<Adapters>({
    container,
    resolverToken: FileStorageResolver,
});

await container.init();
