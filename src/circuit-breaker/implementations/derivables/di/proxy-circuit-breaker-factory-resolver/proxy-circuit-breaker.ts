/**
 * @module CircuitBreaker
 */

import { CIRCUIT_BREAKER_CLASS_TAG } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

import type {
    CircuitBreakerFactoryCreateSettings,
    CircuitBreakerState,
    ICircuitBreaker,
    ICircuitBreakerFactoryResolver,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    AsyncLazy,
    InternalSerdeIdentifiable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxyCircuitBreaker<TAdapters extends string = string>
    implements ICircuitBreaker, InternalSerdeIdentifiable
{
    private circuitBreaker: ICircuitBreaker | null = null;

    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ICircuitBreakerFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly resourceKey: string,
        private readonly createSettings:
            CircuitBreakerFactoryCreateSettings | undefined,
    ) {}

    private async getCircuitBreaker(): Promise<ICircuitBreaker> {
        const factoryResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.circuitBreaker === null) {
            this.circuitBreaker = factoryResolver
                .use(this.adapterName)
                .create(this.resourceKey, this.createSettings);
        }
        return this.circuitBreaker;
    }

    internalClassTag(): symbol {
        return CIRCUIT_BREAKER_CLASS_TAG;
    }

    async internalSerializationId(): Promise<string> {
        const circuitBreaker = await this.getCircuitBreaker();
        if (!isInternalSerdeIdentifiable(circuitBreaker)) {
            throw new Error("!!__MESSAGE__!!");
        }
        return await circuitBreaker.internalSerializationId();
    }

    get key(): string {
        return this.resourceKey;
    }

    async getState(): Promise<CircuitBreakerState> {
        return (await this.getCircuitBreaker()).getState();
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return (await this.getCircuitBreaker()).runOrFail(asyncInvocable);
    }

    async isolate(): Promise<void> {
        return (await this.getCircuitBreaker()).isolate();
    }

    async reset(): Promise<void> {
        return (await this.getCircuitBreaker()).reset();
    }
}
