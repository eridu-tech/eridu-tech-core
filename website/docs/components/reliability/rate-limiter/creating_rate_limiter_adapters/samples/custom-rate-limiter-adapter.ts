import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "eridu-tech/rate-limiter/contracts";

export class MyRateLimiterAdapter implements IRateLimiterAdapter {
    private readonly entries = new Map<string, IRateLimiterAdapterState>();

    getState(key: string): Promise<IRateLimiterAdapterState | null> {
        return Promise.resolve(this.entries.get(key) ?? null);
    }

    updateState(key: string, limit: number): Promise<IRateLimiterAdapterState> {
        const previous = this.entries.get(key);
        const attempt = (previous?.attempt ?? 0) + 1;
        const success = attempt <= limit;
        const resetTime = previous?.resetTime ?? new Date();

        // A real adapter applies the configured policy here.
        const state: IRateLimiterAdapterState = { success, attempt, resetTime };
        this.entries.set(key, state);
        return Promise.resolve(state);
    }

    reset(key: string): Promise<void> {
        this.entries.delete(key);
        return Promise.resolve();
    }
}
