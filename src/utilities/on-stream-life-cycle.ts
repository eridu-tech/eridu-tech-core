/**
 * @module Utilities
 */
import type { InvocableFn, Promisable } from "@/utilities/_module-exports.js";

/**
 * Settings for the {@link OnStreamLifeCycle} stream wrapper.
 *
 * @internal
 */
export type OnStreamLifeCycleSettings<TValue = unknown> = {
    /**
     * The stream to wrap.
     */
    stream: AsyncIterable<TValue>;

    /**
     * Invoked once, and awaited, before the iteration starts.
     */
    onBeforeStart?: InvocableFn<[], Promisable<void>>;

    /**
     * Invoked once, and awaited, before the first value is yielded.
     */
    onStart?: InvocableFn<[], Promisable<void>>;

    /**
     * Invoked once, and awaited, after the iteration finishes.
     */
    onEnd?: InvocableFn<[], Promisable<void>>;

    /**
     * Invoked at most once, and awaited, when the wrapped stream or another
     * lifecycle callback throws. The error is re-thrown afterwards.
     */
    onFailure?: InvocableFn<[error: unknown], Promisable<void>>;

    /**
     * Invoked for every value, and awaited, before that value is yielded.
     */
    onBeforeProcess?: InvocableFn<[value: TValue], Promisable<void>>;

    /**
     * Invoked for every value, and awaited, once the consumer asks for the next
     * value. Skipped for the value the consumer stops at.
     */
    onAfterProcess?: InvocableFn<[value: TValue], Promisable<void>>;
};

/**
 * Runs `onBeforeStart`, then `onStart` once before the first value is yielded
 * and `onEnd` once when the iteration finishes, whether it completes, is closed
 * early or throws. `onBeforeProcess` and `onAfterProcess` run around every
 * yielded value, and `onFailure` runs once when the iteration fails.
 *
 * @internal
 */
export class OnStreamLifeCycle<TValue> implements AsyncIterable<TValue> {
    private hasBeforeStarted = false;

    private hasStarted = false;

    private hasEnded = false;

    private hasFailed = false;

    constructor(private readonly settings: OnStreamLifeCycleSettings<TValue>) {}

    private async beforeStart(): Promise<void> {
        if (this.hasBeforeStarted) {
            return;
        }
        this.hasBeforeStarted = true;
        await this.settings.onBeforeStart?.();
    }

    private async start(): Promise<void> {
        if (this.hasStarted) {
            return;
        }
        this.hasStarted = true;
        await this.settings.onStart?.();
    }

    private async end(): Promise<void> {
        if (this.hasEnded) {
            return;
        }
        this.hasEnded = true;
        await this.settings.onEnd?.();
    }

    private async failure(error: unknown): Promise<void> {
        if (this.hasFailed) {
            return;
        }
        this.hasFailed = true;
        await this.settings.onFailure?.(error);
    }

    async *[Symbol.asyncIterator](): AsyncIterator<TValue> {
        await this.beforeStart();
        try {
            await this.start();
            for await (const item of this.settings.stream) {
                await this.settings.onBeforeProcess?.(item);
                yield item;
                await this.settings.onAfterProcess?.(item);
            }
        } catch (error: unknown) {
            await this.failure(error);
            throw error;
        } finally {
            await this.end();
        }
    }
}
