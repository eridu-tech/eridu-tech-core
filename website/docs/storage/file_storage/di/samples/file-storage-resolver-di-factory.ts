import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { FileStorageResolver } from "eridu-tech/file-storage";
import { fileStorageResolverDiFactory } from "eridu-tech/file-storage/di";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";

type Adapters = "storage1" | "storage2";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const fileStorageResolver = new FileStorageResolver<Adapters>({
    adapters: {
        storage1: new SignedFileStorageAdapter({
            adapter: new MemoryFileStorageAdapter(),
            urlAdapter: {},
        }),
        storage2: new SignedFileStorageAdapter({
            adapter: new MemoryFileStorageAdapter(),
            urlAdapter: {},
        }),
    },
    defaultAdapter: "storage1",
});

container.registerValue({
    token: FileStorageResolver,
    value: fileStorageResolver,
});

// Create the proxy before container.init()
export const fileStorage = fileStorageResolverDiFactory<Adapters>(
    container,
    FileStorageResolver,
);

await container.init();
