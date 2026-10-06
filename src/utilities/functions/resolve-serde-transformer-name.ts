import { getConstructorName } from "@/utilities/functions/get-constructor-name.js";

/**
 * @internal
 */
export function resolveSerdeTransformerName(
    serdeTransformerName: string | undefined,
    adapter: object,
): string {
    if (serdeTransformerName === undefined) {
        return getConstructorName(adapter);
    }
    return `${serdeTransformerName}${getConstructorName(adapter)}`;
}
