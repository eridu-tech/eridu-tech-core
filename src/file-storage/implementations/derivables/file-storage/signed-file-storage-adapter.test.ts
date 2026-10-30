import { beforeEach, describe, expect, test, vi } from "vitest";

import { SignedFileStorageAdapter } from "@/file-storage/implementations/adapters/signed-file-storage-adapter/signed-file-storage-adapter.js";

import type {
    FileAdapterMetadata,
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
    IFileStorageAdapter,
    IFileUrlAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type { Bytes, ByteStream } from "@/utilities/_module-exports.js";

describe("class: SignedFileStorageAdapter", () => {
    let signedFileStorageAdapter: SignedFileStorageAdapter;
    const fileStorageAdapter: IFileStorageAdapter = {
        exists(_key: string): Promise<boolean> {
            return Promise.resolve(false);
        },
        getStream(_key: string): Promise<ByteStream | null> {
            return Promise.resolve(null);
        },
        getBytes(_key: string): Promise<Bytes | null> {
            return Promise.resolve(null);
        },
        getMetaData(_key: string): Promise<FileAdapterMetadata | null> {
            return Promise.resolve(null);
        },
        put(_key: string, _content: WritableFileAdapterContent): Promise<void> {
            return Promise.resolve();
        },
        putStream(
            _key: string,
            _stream: WritableFileAdapterStream,
        ): Promise<void> {
            return Promise.resolve();
        },
        copy(_source: string, _destination: string): Promise<boolean> {
            return Promise.resolve(false);
        },
        move(_source: string, _destination: string): Promise<boolean> {
            return Promise.resolve(false);
        },
        removeMany(_keys: Array<string>): Promise<void> {
            return Promise.resolve();
        },
        removeByPrefix(_prefix: string): Promise<void> {
            return Promise.resolve();
        },
    };
    const fileUrlAdapter: IFileUrlAdapter = {
        getPublicUrl(_key: string): Promise<string> {
            return Promise.resolve("");
        },
        getSignedDownloadUrl(
            _key: string,
            _settings: FileAdapterSignedDownloadUrlSettings,
        ): Promise<string> {
            return Promise.resolve("");
        },
        getSignedUploadUrl(
            _key: string,
            _settings: FileAdapterSignedUploadUrlSettings,
        ): Promise<string> {
            return Promise.resolve("");
        },
    };
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        signedFileStorageAdapter = new SignedFileStorageAdapter({
            adapter: fileStorageAdapter,
            urlAdapter: fileUrlAdapter,
        });
    });

    describe("method: exists", () => {
        test("Should call IFileStorageAdapter.exists", async () => {
            const existsSpy = vi.spyOn(fileStorageAdapter, "exists");

            await signedFileStorageAdapter.exists("a");

            expect(existsSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getStream", () => {
        test("Should call IFileStorageAdapter.getStream", async () => {
            const getStreamSpy = vi.spyOn(fileStorageAdapter, "getStream");

            await signedFileStorageAdapter.getStream("a");

            expect(getStreamSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getBytes", () => {
        test("Should call IFileStorageAdapter.getBytes", async () => {
            const getBytesSpy = vi.spyOn(fileStorageAdapter, "getBytes");

            await signedFileStorageAdapter.getBytes("a");

            expect(getBytesSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getMetaData", () => {
        test("Should call IFileStorageAdapter.getMetaData", async () => {
            const getMetaDataSpy = vi.spyOn(fileStorageAdapter, "getMetaData");

            await signedFileStorageAdapter.getMetaData("a");

            expect(getMetaDataSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: put", () => {
        test("Should call IFileStorageAdapter.put", async () => {
            const putSpy = vi.spyOn(fileStorageAdapter, "put");

            await signedFileStorageAdapter.put("a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: new Uint8Array(Buffer.from("CONTENT", "utf8")),
                fileSizeInBytes: 0,
            });

            expect(putSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: putStream", () => {
        test("Should call IFileStorageAdapter.putStream", async () => {
            const putStreamSpy = vi.spyOn(fileStorageAdapter, "putStream");

            await signedFileStorageAdapter.putStream("a", {
                contentType: "",
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
                data: {
                    async *[Symbol.asyncIterator](): AsyncIterator<Bytes> {
                        yield Promise.resolve(
                            new Uint8Array(Buffer.from("CONTENT", "utf8")),
                        );
                    },
                },
                fileSizeInBytes: 0,
            });

            expect(putStreamSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: copy", () => {
        test("Should call IFileStorageAdapter.copy", async () => {
            const copySpy = vi.spyOn(fileStorageAdapter, "copy");

            await signedFileStorageAdapter.copy("a", "b");

            expect(copySpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: move", () => {
        test("Should call IFileStorageAdapter.move", async () => {
            const moveSpy = vi.spyOn(fileStorageAdapter, "move");

            await signedFileStorageAdapter.move("a", "b");

            expect(moveSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: removeMany", () => {
        test("Should call IFileStorageAdapter.removeMany", async () => {
            const removeManySpy = vi.spyOn(fileStorageAdapter, "removeMany");

            await signedFileStorageAdapter.removeMany(["a"]);

            expect(removeManySpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: removeByPrefix", () => {
        test("Should call IFileStorageAdapter.removeByPrefix", async () => {
            const removeManySpy = vi.spyOn(
                fileStorageAdapter,
                "removeByPrefix",
            );

            await signedFileStorageAdapter.removeByPrefix("a");

            expect(removeManySpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getPublicUrl", () => {
        test("Should call IFileUrlAdapter.getPublicUrl", async () => {
            const getPublicUrlSpy = vi.spyOn(fileUrlAdapter, "getPublicUrl");

            await signedFileStorageAdapter.getPublicUrl("a");

            expect(getPublicUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should call IFileUrlAdapter.getSignedDownloadUrl", async () => {
            const getSignedDownloadUrlSpy = vi.spyOn(
                fileUrlAdapter,
                "getSignedDownloadUrl",
            );

            await signedFileStorageAdapter.getSignedDownloadUrl("a", {
                contentDisposition: null,
                contentType: null,
                expirationInSeconds: 5000,
            });

            expect(getSignedDownloadUrlSpy).toHaveBeenCalledOnce();
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should call IFileUrlAdapter.getSignedUploadUrl", async () => {
            const getSignedUploadUrlSpy = vi.spyOn(
                fileUrlAdapter,
                "getSignedUploadUrl",
            );

            await signedFileStorageAdapter.getSignedUploadUrl("a", {
                contentType: null,
                expirationInSeconds: 5000,
            });

            expect(getSignedUploadUrlSpy).toHaveBeenCalledOnce();
        });
    });
});
