import { FsFileStorageAdapter } from "eridu-tech/file-storage/fs-file-storage-adapter";
import { SignedFileStorageAdapter } from "eridu-tech/file-storage/signed-file-storage-adapter";

export const fsFileStorageAdapter = new SignedFileStorageAdapter({
    adapter: new FsFileStorageAdapter({}),
    urlAdapter: {},
});
