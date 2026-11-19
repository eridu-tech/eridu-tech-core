import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";
import { isBinaryData } from "@/test-utilities/functions/is-binary-data.js";

/**
 * @internal
 */
export function isBytesArrayEqualityTester(
    a: unknown,
    b: unknown,
): boolean | undefined {
    if (!isBinaryData(a)) {
        return;
    }

    if (!isBinaryData(b)) {
        return;
    }
    const uInt8ArrayA = resolveFileContent(a);
    const uInt8ArrayB = resolveFileContent(b);
    if (uInt8ArrayA.length !== uInt8ArrayB.length) {
        return false;
    }
    for (let i = 0; i < uInt8ArrayA.length; i++) {
        if (uInt8ArrayA[i] !== uInt8ArrayB[i]) {
            return false;
        }
    }
    return true;
}
