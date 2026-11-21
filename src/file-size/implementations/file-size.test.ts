import { describe, expect, test } from "vitest";

import { TO_BYTES } from "@/file-size/contracts/_module-exports.js";
import { FileSize } from "@/file-size/implementations/_module-exports.js";

describe(
    "class: FileSize",
    { tags: ["Memory", "Implementations", "FileSize"] },
    () => {
        describe("static method: fromBytes", () => {
            test("Should create a file size from bytes", () => {
                expect(FileSize.fromBytes(1_500).toBytes()).toBe(1_500);
            });
        });

        describe("static method: fromKiloBytes", () => {
            test("Should convert kilobytes to bytes", () => {
                expect(FileSize.fromKiloBytes(2).toBytes()).toBe(2_000);
            });
        });

        describe("static method: fromMegaBytes", () => {
            test("Should convert megabytes to bytes", () => {
                expect(FileSize.fromMegaBytes(2).toBytes()).toBe(2_000_000);
            });
        });

        describe("static method: fromGigaBytes", () => {
            test("Should convert gigabytes to bytes", () => {
                expect(FileSize.fromGigaBytes(2).toBytes()).toBe(2_000_000_000);
            });
        });

        describe("static method: fromTeraBytes", () => {
            test("Should convert terabytes to bytes", () => {
                expect(FileSize.fromTeraBytes(2).toBytes()).toBe(
                    2_000_000_000_000,
                );
            });
        });

        describe("static method: fromPetaBytes", () => {
            test("Should convert petabytes to bytes", () => {
                expect(FileSize.fromPetaBytes(2).toBytes()).toBe(
                    2_000_000_000_000_000,
                );
            });
        });

        test("Should clamp negative values to zero", () => {
            expect(FileSize.fromBytes(-1).toBytes()).toBe(0);
            expect(FileSize.fromKiloBytes(-1).toBytes()).toBe(0);
            expect(FileSize.fromPetaBytes(-1).toBytes()).toBe(0);
        });

        describe("method: toBytes", () => {
            test("Should return the total size in bytes", () => {
                expect(FileSize.fromKiloBytes(1).toBytes()).toBe(1_000);
            });
        });

        describe("method: toKiloBytes", () => {
            test("Should floor the size to whole kilobytes", () => {
                expect(FileSize.fromBytes(1_999).toKiloBytes()).toBe(1);
            });
        });

        describe("method: toMegaBytes", () => {
            test("Should floor the size to whole megabytes", () => {
                expect(FileSize.fromKiloBytes(1_999).toMegaBytes()).toBe(1);
            });
        });

        describe("method: toGigaBytes", () => {
            test("Should floor the size to whole gigabytes", () => {
                expect(FileSize.fromMegaBytes(1_999).toGigaBytes()).toBe(1);
            });
        });

        describe("method: toTeraBytes", () => {
            test("Should floor the size to whole terabytes", () => {
                expect(FileSize.fromGigaBytes(1_999).toTeraBytes()).toBe(1);
            });
        });

        describe("method: toPetaBytes", () => {
            test("Should floor the size to whole petabytes", () => {
                expect(FileSize.fromTeraBytes(1_999).toPetaBytes()).toBe(1);
            });
        });

        describe("method: equals", () => {
            test("Should return true when given an equal file size", () => {
                expect(
                    FileSize.fromKiloBytes(1).equals(FileSize.fromBytes(1_000)),
                ).toBe(true);
            });

            test("Should return false when given a different file size", () => {
                expect(
                    FileSize.fromKiloBytes(1).equals(FileSize.fromBytes(1_001)),
                ).toBe(false);
            });

            test("Should compare against any IFileSize", () => {
                expect(
                    FileSize.fromBytes(500).equals({
                        [TO_BYTES]: () => 500,
                    }),
                ).toBe(true);
            });
        });

        describe("method: gt", () => {
            test("Should return true when greater than the given file size", () => {
                expect(
                    FileSize.fromKiloBytes(2).gt(FileSize.fromKiloBytes(1)),
                ).toBe(true);
                expect(
                    FileSize.fromKiloBytes(1).gt(FileSize.fromKiloBytes(1)),
                ).toBe(false);
            });
        });

        describe("method: gte", () => {
            test("Should return true when greater than or equal to the given file size", () => {
                expect(
                    FileSize.fromKiloBytes(2).gte(FileSize.fromKiloBytes(1)),
                ).toBe(true);
                expect(
                    FileSize.fromKiloBytes(1).gte(FileSize.fromKiloBytes(1)),
                ).toBe(true);
                expect(
                    FileSize.fromKiloBytes(1).gte(FileSize.fromKiloBytes(2)),
                ).toBe(false);
            });
        });

        describe("method: lt", () => {
            test("Should return true when less than the given file size", () => {
                expect(
                    FileSize.fromKiloBytes(1).lt(FileSize.fromKiloBytes(2)),
                ).toBe(true);
                expect(
                    FileSize.fromKiloBytes(1).lt(FileSize.fromKiloBytes(1)),
                ).toBe(false);
            });
        });

        describe("method: lte", () => {
            test("Should return true when less than or equal to the given file size", () => {
                expect(
                    FileSize.fromKiloBytes(1).lte(FileSize.fromKiloBytes(2)),
                ).toBe(true);
                expect(
                    FileSize.fromKiloBytes(1).lte(FileSize.fromKiloBytes(1)),
                ).toBe(true);
                expect(
                    FileSize.fromKiloBytes(2).lte(FileSize.fromKiloBytes(1)),
                ).toBe(false);
            });
        });

        test("Should expose the size through TO_BYTES", () => {
            expect(FileSize.fromKiloBytes(3)[TO_BYTES]()).toBe(3_000);
        });

        describe("static property: serdeTransformer", () => {
            test("isApplicable Should return true for FileSize instances", () => {
                expect(
                    FileSize.serdeTransformer.isApplicable(
                        FileSize.fromBytes(1),
                    ),
                ).toBe(true);
            });

            test("isApplicable Should return false for non-FileSize values", () => {
                expect(FileSize.serdeTransformer.isApplicable(1)).toBe(false);
                expect(FileSize.serdeTransformer.isApplicable("1kb")).toBe(
                    false,
                );
            });

            test("serialize Should return the version and size in bytes", () => {
                expect(
                    FileSize.serdeTransformer.serialize(
                        FileSize.fromKiloBytes(2),
                    ),
                ).toStrictEqual({
                    version: "1",
                    fileSizeInBytes: 2_000,
                });
            });

            test("deserialize Should recreate the file size", () => {
                const fileSize = FileSize.serdeTransformer.deserialize({
                    version: "1",
                    fileSizeInBytes: 2_000,
                });

                expect(fileSize).toBeInstanceOf(FileSize);
                expect(fileSize.toBytes()).toBe(2_000);
            });
        });
    },
);
