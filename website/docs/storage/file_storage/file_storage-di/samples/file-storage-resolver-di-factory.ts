import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { FileStorageResolver } from "eridu-tech/file-storage";
import { ProxyFileStorageResolver } from "eridu-tech/file-storage/di";
import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";

type Adapters = "memory" | "fs";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const fileStorageResolver = new FileStorageResolver<Adapters>({
    adapters: {
        memory: new SignedFileStorageAdapter({
            adapter: new MemoryFileStorageAdapter(),
            urlAdapter: {},
        }),
        fs: new SignedFileStorageAdapter({
            adapter: new FsFileStorageAdapter(),
            urlAdapter: {},
        }),
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
