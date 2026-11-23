/**
 * @module CircuitBreaker
 */

import { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/_module-exports.js";
import {
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type { BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import type {
    AllCircuitBreakerState,
    ClosedState,
    HalfOpenState,
    OpenState,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { ICircuitBreakerPolicy } from "@/circuit-breaker/implementations/adapters/_shared/_module.js";

/**
 * @internal
 */
export type BackoffPolicySettings = {
    currentDate: Date;
    backoffPolicy: BackoffPolicy;
};

/**
 * @internal
 */
export class InternalCircuitBreakerPolicy<TMetrics = unknown> {
    constructor(
        private readonly circuitBreakerPolicy: ICircuitBreakerPolicy<TMetrics>,
    ) {}

    private isMetricsEqual(metricsA: TMetrics, metricsB: TMetrics): boolean {
        return this.circuitBreakerPolicy.isEqual?.(metricsA, metricsB) ?? false;
    }

    private isClosedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.CLOSED &&
            stateB.type === CIRCUIT_BREAKER_STATE.CLOSED
        ) {
            return this.isMetricsEqual(stateA.metrics, stateB.metrics);
        }
        return false;
    }

    private isOpenedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.OPEN &&
            stateB.type === CIRCUIT_BREAKER_STATE.OPEN
        ) {
            return (
                stateA.attempt === stateB.attempt &&
                stateA.startedAt === stateB.startedAt
            );
        }
        return false;
    }

    private isHalfOpenedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.HALF_OPEN &&
            stateB.type === CIRCUIT_BREAKER_STATE.HALF_OPEN
        ) {
            return (
                stateA.attempt === stateB.attempt &&
                this.isMetricsEqual(stateA.metrics, stateB.metrics)
            );
        }
        return false;
    }

    private isIsolatedStateEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        if (
            stateA.type === CIRCUIT_BREAKER_STATE.ISOLATED &&
            stateB.type === CIRCUIT_BREAKER_STATE.ISOLATED
        ) {
            return true;
        }
        return false;
    }

    isEqual(
        stateA: AllCircuitBreakerState<TMetrics>,
        stateB: AllCircuitBreakerState<TMetrics>,
    ): boolean {
        return (
            this.isClosedStateEqual(stateA, stateB) ||
            this.isOpenedStateEqual(stateA, stateB) ||
            this.isHalfOpenedStateEqual(stateA, stateB) ||
            this.isIsolatedStateEqual(stateA, stateB)
        );
    }

    initialState(): ClosedState<TMetrics> {
        return {
            type: CIRCUIT_BREAKER_STATE.CLOSED,
            metrics: this.circuitBreakerPolicy.initialMetrics(),
        };
    }

    whenClosed(
        currentState: ClosedState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> | OpenState {
        const transition = this.circuitBreakerPolicy.whenClosed(
            currentState.metrics,
            new Date(currentDate),
        );
        if (transition === CLOSED_TRANSITIONS.NONE) {
            return currentState;
        }
        return {
            type: CIRCUIT_BREAKER_STATE.OPEN,
            attempt: 1,
            startedAt: new Date(currentDate).getTime(),
        };
    }

    whenOpened(
        currentState: OpenState,
        settings: BackoffPolicySettings,
    ): OpenState | HalfOpenState<TMetrics> {
        const waitTime = TimeSpan.fromTimeSpan(
            callInvocable(settings.backoffPolicy, currentState.attempt, null),
        );
        const endDate = waitTime.toEndDate(new Date(currentState.startedAt));
        const isWaitTimeOver = endDate <= new Date(settings.currentDate);

        if (isWaitTimeOver) {
            return {
                type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                attempt: currentState.attempt,
                metrics: this.circuitBreakerPolicy.initialMetrics(),
            };
        }

        return currentState;
    }

    whenHalfOpened(
        currentState: HalfOpenState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> | OpenState | HalfOpenState<TMetrics> {
        const transition = this.circuitBreakerPolicy.whenHalfOpened(
            currentState.metrics,
            new Date(currentDate),
        );
        if (transition === HALF_OPEN_TRANSITIONS.NONE) {
            return currentState;
        }
        if (transition === HALF_OPEN_TRANSITIONS.TO_CLOSED) {
            return {
                type: CIRCUIT_BREAKER_STATE.CLOSED,
                metrics: this.circuitBreakerPolicy.initialMetrics(),
            };
        }
        return {
            type: CIRCUIT_BREAKER_STATE.OPEN,
            attempt: currentState.attempt + 1,
            startedAt: new Date(currentDate).getTime(),
        };
    }

    trackSuccessWhenClosed(
        currentState: ClosedState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackSuccess(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }

    trackFailureWhenClosed(
        currentState: ClosedState<TMetrics>,
        currentDate: Date,
    ): ClosedState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackFailure(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }

    trackSuccessWhenHalfOpened(
        currentState: HalfOpenState<TMetrics>,
        currentDate: Date,
    ): HalfOpenState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackSuccess(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }

    trackFailureWhenHalfOpened(
        currentState: HalfOpenState<TMetrics>,
        currentDate: Date,
    ): HalfOpenState<TMetrics> {
        const newMetrics = this.circuitBreakerPolicy.trackFailure(
            currentState,
            {
                currentDate: new Date(currentDate),
                initialMetrics: this.circuitBreakerPolicy.initialMetrics(),
            },
        );
        return {
            ...currentState,
            metrics: newMetrics,
        };
    }
}
