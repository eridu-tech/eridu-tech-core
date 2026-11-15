/**
 * @module Utilities
 */
import type { InvocableFn, Promisable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class OnStreamEnd<TValue> implements AsyncIterable<TValue> {
    private hasEnded = false;

    constructor(
        private readonly iterable: AsyncIterable<TValue>,
        private readonly onEnd: InvocableFn<[], Promisable<void>>,
    ) {}

    private async finish(): Promise<void> {
        if (this.hasEnded) {
            return;
        }
        this.hasEnded = true;
        await this.onEnd();
    }

    async *[Symbol.asyncIterator](): AsyncIterator<TValue> {
        try {
            yield* this.iterable;
        } finally {
            await this.finish();
        }
    }
}
