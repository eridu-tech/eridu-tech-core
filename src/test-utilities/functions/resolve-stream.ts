/**
 * @internal
 */
export async function resolveStream(
    stream: AsyncIterable<Uint8Array> | null,
): Promise<Uint8Array | null> {
    if (!stream) {
        return null;
    }

    const chunks: Array<Uint8Array> = [];
    let totalLength = 0;

    // 1. Collect all chunks and track the total byte length
    for await (const chunk of stream) {
        chunks.push(chunk);
        totalLength += chunk.byteLength;
    }

    // Handle empty streams
    if (chunks.length === 0) {
        return new Uint8Array(0);
    }

    // 2. Optimization: If there's only one chunk, just return it
    if (chunks.length === 1) {
        const chunk = chunks[0];
        if (chunk === undefined) {
            return null;
        }
        return chunk;
    }

    // 3. Allocate the final memory once
    const result = new Uint8Array(totalLength);
    let offset = 0;

    // 4. Copy each chunk into the final array
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return result;
}
