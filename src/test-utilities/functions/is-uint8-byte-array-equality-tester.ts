/**
 * @internal
 */
export function isUint8ByteArrayEqualityTester(
    a: unknown,
    b: unknown,
): boolean | undefined {
    if (!(a instanceof Uint8Array)) {
        return;
    }

    if (!(b instanceof Uint8Array)) {
        return;
    }

    return Buffer.from(a).equals(b);
}
