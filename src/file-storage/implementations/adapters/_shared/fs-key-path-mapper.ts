/**
 * @module FileStorage
 */

import type { ICodec } from "@/codec/contracts/_module-exports.js";

/**
 * @internal
 */
export class FsKeyPathMapper {
    private static readonly nestedDir = "N";
    private static readonly keysDir = "K";
    private static readonly pathDirPrefix = "S_";

    constructor(
        private readonly delimiter: string,
        private readonly codec: ICodec<string, string>,
    ) {}

    toPath(key: string): string {
        return key
            .split(this.delimiter)
            .map(
                (segment) =>
                    `${FsKeyPathMapper.pathDirPrefix}${this.codec.encode(segment)}`,
            )
            .map((segment, index, { length }) => {
                const isLast = index === length - 1;
                if (isLast) {
                    return [FsKeyPathMapper.keysDir, segment];
                }

                return [FsKeyPathMapper.nestedDir, segment];
            })
            .flat()
            .join("/");
    }

    toDirectoryPath(key: string): string {
        return this.toPath(key).split("/").slice(0, -1).join("/");
    }

    fromPath(path: string): string {
        return path
            .split(this.delimiter)
            .map((segment) => {
                if (segment.startsWith(FsKeyPathMapper.pathDirPrefix)) {
                    return this.codec.decode(
                        segment.slice(FsKeyPathMapper.pathDirPrefix.length),
                    );
                }

                return segment;
            })
            .filter(
                (segment) =>
                    ![
                        FsKeyPathMapper.nestedDir,
                        FsKeyPathMapper.keysDir,
                    ].includes(segment),
            )
            .join(this.delimiter);
    }
}
