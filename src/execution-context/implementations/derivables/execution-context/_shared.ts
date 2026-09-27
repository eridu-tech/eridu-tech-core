import { isClass } from "@/utilities/_module-exports.js";

import type { ContextToken } from "@/execution-context/contracts/_module-exports.js";

export function tokenToString<T>(diToken: ContextToken<T>): string {
    if (isClass(diToken)) {
        return diToken.name;
    }
    return diToken.description;
}
