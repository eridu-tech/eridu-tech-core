import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";

/**
 * @internal
 */
export function createIsTimeSpanEqualityTester(buffer: ITimeSpan) {
    return (a: unknown, b: unknown): boolean | undefined => {
        if (!(a instanceof TimeSpan)) {
            return;
        }
        if (!(b instanceof TimeSpan)) {
            return;
        }
        const upperBound = a.addTimeSpan(
            TimeSpan.fromTimeSpan(buffer).divide(2),
        );
        const lowerBound = a.subtractTimeSpan(
            TimeSpan.fromTimeSpan(buffer).divide(2),
        );
        return b.gte(lowerBound) || b.lte(upperBound);
    };
}
