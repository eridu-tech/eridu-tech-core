import { withFileStorageInferContentTypeOnWrite } from "eridu-tech/file-storage/plugins";
import { withPlugin } from "eridu-tech/middleware";

const contentTypeAdapter = withPlugin(
    adapter,
    withFileStorageInferContentTypeOnWrite({
        inferSignedDownloadUrl: false,
        inferSignedUploadUrl: false,
    }),
);
