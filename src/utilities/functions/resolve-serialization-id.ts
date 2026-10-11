import { getConstructorName } from "@/utilities/functions/get-constructor-name.js";

/**
 * @internal
 */
export function resolveSerializationId(
    serializationId: string | undefined,
    adapter: object,
): string {
    if (serializationId === undefined) {
        return getConstructorName(adapter);
    }
    return `${serializationId}${getConstructorName(adapter)}`;
}
