/**
 * @module CircuitBreaker
 */

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
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxyCircuitBreaker<
    TAdapters extends string = string,
> implements ICircuitBreaker {
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
