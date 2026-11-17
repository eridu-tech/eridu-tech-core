/**
 * @module Utilities
 */
import type { InvocableFn, Promisable } from "@/utilities/_module-exports.js";

/**
 * Settings for the {@link OnStreamLifeCycle} stream wrapper.
 *
 * @internal
 */
export type OnStreamLifeCycleSettings<TValue> = {
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
};

/**
 * Runs `onBeforeStart`, then `onStart` once before the first value is yielded
 * and `onEnd` once when the iteration finishes, whether it completes, is closed
 * early or throws.
 *
 * @internal
 */
export class OnStreamLifeCycle<TValue> implements AsyncIterable<TValue> {
    private hasBeforeStarted = false;

    private hasStarted = false;

    private hasEnded = false;

    private readonly stream: AsyncIterable<TValue>;

    private readonly onBeforeStart:
        InvocableFn<[], Promisable<void>> | undefined;

    private readonly onStart: InvocableFn<[], Promisable<void>> | undefined;

    private readonly onEnd: InvocableFn<[], Promisable<void>> | undefined;

    constructor(settings: OnStreamLifeCycleSettings<TValue>) {
        const { stream, onBeforeStart, onStart, onEnd } = settings;
        this.stream = stream;
        this.onBeforeStart = onBeforeStart;
        this.onStart = onStart;
        this.onEnd = onEnd;
    }

    private async beforeStart(): Promise<void> {
        if (this.hasBeforeStarted) {
            return;
        }
        this.hasBeforeStarted = true;
        await this.onBeforeStart?.();
    }

    private async start(): Promise<void> {
        if (this.hasStarted) {
            return;
        }
        this.hasStarted = true;
        await this.onStart?.();
    }

    private async finish(): Promise<void> {
        if (this.hasEnded) {
            return;
        }
        this.hasEnded = true;
        await this.onEnd?.();
    }

    async *[Symbol.asyncIterator](): AsyncIterator<TValue> {
        await this.beforeStart();
        try {
            await this.start();
            yield* this.stream;
        } finally {
            await this.finish();
        }
    }
}
