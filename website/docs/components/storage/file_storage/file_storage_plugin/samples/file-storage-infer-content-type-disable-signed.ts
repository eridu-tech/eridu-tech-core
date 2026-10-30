import { withPlugin } from "eridu-tech/middleware";
import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageInferContentTypeOnWrite } from "eridu-tech/file-storage/plugins";

const adapter = new MemoryFileStorageAdapter();

const contentTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferContentTypeOnWrite({
        inferSignedDownloadUrl: false,
        inferSignedUploadUrl: false,
    }),
);
