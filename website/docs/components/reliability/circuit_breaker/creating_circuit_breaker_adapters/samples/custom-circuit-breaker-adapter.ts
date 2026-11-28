import { CIRCUIT_BREAKER_STATE } from "eridu-tech/circuit-breaker/contracts";
import type {
    CircuitBreakerState,
    CircuitBreakerStateTransition,
    ICircuitBreakerAdapter,
} from "eridu-tech/circuit-breaker/contracts";

export class MyCircuitBreakerAdapter implements ICircuitBreakerAdapter {
    private readonly states = new Map<string, CircuitBreakerState>();

    getState(key: string): Promise<CircuitBreakerState> {
        return Promise.resolve(
            this.states.get(key) ?? CIRCUIT_BREAKER_STATE.CLOSED,
        );
    }

    updateState(key: string): Promise<CircuitBreakerStateTransition> {
        const from = this.states.get(key) ?? CIRCUIT_BREAKER_STATE.CLOSED;

        // A real adapter applies the configured policy here.
        const to = from;

        this.states.set(key, to);
        return Promise.resolve({ from, to });
    }

    isolate(key: string): Promise<void> {
        this.states.set(key, CIRCUIT_BREAKER_STATE.ISOLATED);
        return Promise.resolve();
    }

    trackFailure(_key: string): Promise<void> {
        // A real adapter accumulates failure metrics here.
        return Promise.resolve();
    }

    trackSuccess(_key: string): Promise<void> {
        // A real adapter accumulates success metrics here.
        return Promise.resolve();
    }

    reset(key: string): Promise<void> {
        this.states.delete(key);
        return Promise.resolve();
    }
}
