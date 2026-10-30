/**
 * @module FileStorage
 */

import { Readable } from "node:stream";
import { buffer } from "node:stream/consumers";

import {
    CopyObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsCommand,
    PutObjectCommand,
    S3ServiceException,
    CreateBucketCommand,
    DeleteBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { callInvocable, UnexpectedError } from "@/utilities/_module-exports.js";

import type { S3Client, ServerSideEncryption } from "@aws-sdk/client-s3";

import type {
    FileAdapterSignedUploadUrlSettings,
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterMetadata,
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type {
    Bytes,
    ByteStream,
    IDeinitizable,
    IInitizable,
    Invocable,
} from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export type S3FilePublicUrlGenerator = Invocable<
    [settings: { key: string; bucket: string; client: S3Client }],
    Promise<string>
>;

/**
 * Configuration for `S3FileStorageAdapter`.
 * Provides AWS S3-backed file storage.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export type S3FileStorageAdapterSettings = {
    /**
     * The AWS S3 client instance for communicating with the S3 API.
     */
    client: S3Client;

    /**
     * The bucket option defines the S3 bucket to use for managing files.
     */
    bucket: string;

    /**
     * The `cdnUrl` field can be used to define the base URL for generating public URL for a file. For example, If you use CloudFront alongside S3 to serve public files, the `cdnUrl` property should be the CloudFront URL.
     * @default null
     */
    cdnUrl?: string | null;

    /**
     * Define ServerSideEncryption option for all objects uploaded to S3. It can be disabled by passing null
     *
     * @default null
     */
    serverSideEncryption?: ServerSideEncryption | null;

    /**
     * Define a custom public url generator for creating public and signed URLs.
     *
     * @default
     * ```ts
     * import { defaultPublicUrlGenerator } from "eridu-tech/file-storage/s3-file-storage-adapter"
     * defaultPublicUrlGenerator
     * ```
     */
    publicUrlGenerator?: S3FilePublicUrlGenerator;
};

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export const defaultPublicUrlGenerator: S3FilePublicUrlGenerator = async ({
    key,
    bucket,
    client,
}) => {
    if (client.config.endpoint === undefined) {
        return new URL(
            `/${key}`,
            `https://${bucket}.s3.amazonaws.com`,
        ).toString();
    }

    const endpoint = await client.config.endpoint();
    let baseUrl = `${endpoint.protocol}//${endpoint.hostname}`;

    if (endpoint.port !== undefined) {
        baseUrl += `:${String(endpoint.port)}`;
    }

    return new URL(`/${bucket}/${key}`, baseUrl).toString();
};

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/aws-file-storage-adapter"`
 * @group Adapters
 */
export class S3FileStorageAdapter
    implements ISignedFileStorageAdapter, IDeinitizable, IInitizable
{
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly cdnUrl: string | null;
    private readonly serverSideEncryption: ServerSideEncryption | undefined;
    private readonly publicUrlGenerator: S3FilePublicUrlGenerator;

    constructor(settings: S3FileStorageAdapterSettings) {
        const {
            client,
            bucket,
            cdnUrl = null,
            serverSideEncryption = null,
            publicUrlGenerator = defaultPublicUrlGenerator,
        } = settings;

        this.client = client;
        this.bucket = bucket;
        this.cdnUrl = cdnUrl;
        this.serverSideEncryption = serverSideEncryption ?? undefined;
        this.publicUrlGenerator = publicUrlGenerator;
    }

    /**
     * Creates the bucket where the files will be saved.
     */
    async init(): Promise<void> {
        try {
            await this.client.send(
                new CreateBucketCommand({
                    Bucket: this.bucket,
                }),
            );
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the bucket where the files are saved.
     */
    async deInit(): Promise<void> {
        try {
            await this.client.send(
                new DeleteBucketCommand({
                    Bucket: this.bucket,
                }),
            );
        } catch {
            /* EMPTY */
        }
    }

    private static throwUnlessS3StatusError(
        error: unknown,
        statusCode: number,
    ): void {
        if (!(error instanceof S3ServiceException)) {
            throw error;
        }
        if (error.$metadata.httpStatusCode !== statusCode) {
            throw error;
        }
    }

    async getPublicUrl(key: string): Promise<string> {
        if (this.cdnUrl !== null) {
            return new URL(key, this.cdnUrl).toString();
        }

        return await callInvocable(this.publicUrlGenerator, {
            key,
            bucket: this.bucket,
            client: this.client,
        });
    }

    async getSignedDownloadUrl(
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string> {
        return await getSignedUrl(
            this.client,
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
                ResponseContentType: settings.contentType ?? undefined,
                ResponseContentDisposition:
                    settings.contentDisposition ?? undefined,
            }),
            {
                expiresIn: settings.expirationInSeconds,
            },
        );
    }

    async getSignedUploadUrl(
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        return await getSignedUrl(
            this.client,
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                ContentType: settings.contentType ?? undefined,
            }),
            {
                expiresIn: settings.expirationInSeconds,
            },
        );
    }

    private async _exists(key: string): Promise<boolean> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            return response.$metadata.httpStatusCode === 200;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        return this._exists(key);
    }

    async getStream(key: string): Promise<ByteStream | null> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            if (response.Body === undefined) {
                throw UnexpectedError.create("response.Body is undefined");
            }
            return response.Body.transformToWebStream();
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return null;
        }
    }

    async getBytes(key: string): Promise<Bytes | null> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            if (response.Body === undefined) {
                throw UnexpectedError.create("response.Body is undefined");
            }
            return await response.Body.transformToByteArray();
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return null;
        }
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            if (response.ETag === undefined) {
                throw UnexpectedError.create("response.ETag is undefined");
            }
            if (response.ContentType === undefined) {
                throw UnexpectedError.create(
                    "response.ContentType is undefined",
                );
            }
            if (response.ContentLength === undefined) {
                throw UnexpectedError.create(
                    "response.ContentLength is undefined",
                );
            }
            if (response.LastModified === undefined) {
                throw UnexpectedError.create(
                    "response.LastModified is undefined",
                );
            }
            return {
                etag: response.ETag,
                contentType: response.ContentType,
                fileSizeInBytes: response.ContentLength,
                updatedAt: response.LastModified,
            } satisfies FileAdapterMetadata;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return null;
        }
    }

    private static async resolveStreamSettings(
        stream: WritableFileAdapterStream,
    ) {
        return {
            Body:
                stream.fileSizeInBytes === null
                    ? await buffer(stream.data)
                    : Readable.from(stream.data),
            ContentLength: stream.fileSizeInBytes ?? undefined,
        };
    }

    async put(key: string, content: WritableFileAdapterContent): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                Body: content.data,
                ContentType: content.contentType,
                CacheControl: content.cacheControl ?? undefined,
                ContentDisposition: content.contentDisposition ?? undefined,
                ContentEncoding: content.contentEncoding ?? undefined,
                ContentLanguage: content.contentLanguage ?? undefined,
            }),
        );
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                ServerSideEncryption: this.serverSideEncryption,
                Bucket: this.bucket,
                Key: key,
                ...(await S3FileStorageAdapter.resolveStreamSettings(stream)),
                ContentType: stream.contentType,
                CacheControl: stream.cacheControl ?? undefined,
                ContentDisposition: stream.contentDisposition ?? undefined,
                ContentEncoding: stream.contentEncoding ?? undefined,
                ContentLanguage: stream.contentLanguage ?? undefined,
            }),
        );
    }

    private async _copy(source: string, destination: string): Promise<boolean> {
        try {
            await this.client.send(
                new CopyObjectCommand({
                    ServerSideEncryption: this.serverSideEncryption,
                    Bucket: this.bucket,
                    Key: destination,
                    CopySource: `${this.bucket}/${source}`,
                }),
            );
            return true;
        } catch (error: unknown) {
            S3FileStorageAdapter.throwUnlessS3StatusError(error, 404);
            return false;
        }
    }

    async copy(source: string, destination: string): Promise<boolean> {
        return this._copy(source, destination);
    }

    async move(source: string, destination: string): Promise<boolean> {
        const hasMoved = await this._copy(source, destination);
        if (hasMoved) {
            await this._removeMany([source]);
        }
        return hasMoved;
    }

    private async _removeMany(keys: Array<string>): Promise<void> {
        await this.client.send(
            new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: keys.map((key) => ({ Key: key })),
                },
            }),
        );
    }

    async removeMany(keys: Array<string>): Promise<void> {
        return this._removeMany(keys);
    }

    async removeByPrefix(prefix: string): Promise<void> {
        const listResponse = await this.client.send(
            new ListObjectsCommand({
                Bucket: this.bucket,
                Prefix: prefix,
            }),
        );
        if (listResponse.Contents?.length === 0) {
            return;
        }
        const keysToDelete =
            listResponse.Contents?.map((item) => item.Key).filter(
                (key) => key !== undefined,
            ) ?? [];
        await this._removeMany(keysToDelete);
    }
}
