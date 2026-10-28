/**
 * @module GenericPool
 */

import { UnableToAcquireError } from "@/generic-pool/contracts/_module-exports.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    IGenericPool,
    IResourceFactory,
} from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * Options for setting the pool size and the number of waiting callers.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool"`
 * @group Implementations
 */
export type QueuePoolSettings = {
    /**
     * Maximum number of resources the pool can create.
     * @default 10
     */
    maxResources?: number;

    /**
     * Maximum number of callers that can wait for a resource. Use `null` for no limit.
     * @default null
     */
    maxWaitSize?: number | null;
};

/**
 * @internal
 */
type WaitingCaller<TClient> = {
    promise: Promise<TClient>;
    resolve: (client: TClient) => void;
    reject: (error: unknown) => void;
};

/**
 * A pool that creates reusable resources and queues callers when none are available.
 *
 * Idle resources and waiting callers are both served in a first-in-first-out order. The
 * wait queue is bounded by `maxWaitSize`: once it is full, `acquireOrFail` fails instead of
 * queuing more callers.
 *
 * A recycled resource is checked with `IResourceFactory.validate` before it is handed to a
 * caller. An unusable resource is destroyed and replaced.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool"`
 * @group Implementations
 */
export class QueuePool<TClient> implements IGenericPool<TClient> {
    private readonly maxResources: number;
    private readonly maxWaitSize: number | null;
    private readonly idleClients: Array<TClient> = [];
    private readonly borrowedClients = new Set<TClient>();
    private readonly waitingCallers: Array<WaitingCaller<TClient>> = [];
    private resourceCount = 0;
    private isClosed = false;

    private static validateSettings(
        maxResources: number,
        maxWaitSize: number | null,
    ): void {
        if (!Number.isInteger(maxResources) || maxResources < 1) {
            throw new TypeError(
                "maxResources must be an integer larger than 0",
            );
        }
        if (
            maxWaitSize !== null &&
            (!Number.isInteger(maxWaitSize) || maxWaitSize < 0)
        ) {
            throw new TypeError(
                "maxWaitSize must be a non-negative integer or null",
            );
        }
    }

    private static createPoolClosedError(): UnableToAcquireError {
        return UnableToAcquireError.create(
            "Cannot acquire a client from a closed pool",
        );
    }

    private static createWaitingCaller<TValue>(): WaitingCaller<TValue> {
        // The promise executor runs synchronously, so both placeholders are replaced
        // before the caller is ever used.
        let resolve: (client: TValue) => void = () => undefined;
        let reject: (error: unknown) => void = () => undefined;
        const promise = new Promise<TValue>((resolve_, reject_) => {
            resolve = resolve_;
            reject = reject_;
        });
        return { promise, resolve, reject };
    }

    /**
     * @throws {TypeError} When `maxResources` is not a positive integer.
     * @throws {TypeError} When `maxWaitSize` is neither `null` nor a non-negative integer.
     */
    constructor(
        private readonly resourceFactory: IResourceFactory<TClient>,
        settings: QueuePoolSettings = {},
    ) {
        const { maxResources = 10, maxWaitSize = null } = settings;

        QueuePool.validateSettings(maxResources, maxWaitSize);

        this.maxResources = maxResources;
        this.maxWaitSize = maxWaitSize;
    }

    acquireOrFail(): Promise<TClient> {
        if (this.isClosed) {
            return Promise.reject(QueuePool.createPoolClosedError());
        }
        if (!this.hasFreeCapacity() && this.isWaitQueueFull()) {
            return Promise.reject(
                UnableToAcquireError.create(
                    `Cannot wait for a client, the wait queue has reached its limit of ${String(this.maxWaitSize)} callers`,
                ),
            );
        }

        const caller = QueuePool.createWaitingCaller<TClient>();
        this.waitingCallers.push(caller);
        this.dispense();
        return caller.promise;
    }

    /**
     * Releasing a client that was not acquired from the pool is a no-op.
     */
    async release(client: TClient): Promise<void> {
        if (!this.borrowedClients.delete(client)) {
            return;
        }
        if (this.isClosed) {
            await this.destroyClient(client);
            return;
        }

        this.idleClients.push(client);
        this.dispense();
    }

    /**
     * Destroys all idle clients and rejects all waiting callers. Clients that are in use
     * are destroyed when they are released.
     */
    async close(): Promise<void> {
        if (this.isClosed) {
            return;
        }
        this.isClosed = true;

        for (const caller of this.waitingCallers.splice(0)) {
            caller.reject(QueuePool.createPoolClosedError());
        }

        const idleClients = this.idleClients.splice(0);
        await Promise.all(
            idleClients.map((client) => this.destroyClient(client)),
        );
    }

    private hasFreeCapacity(): boolean {
        return (
            this.idleClients.length > 0 ||
            this.resourceCount < this.maxResources
        );
    }

    private isWaitQueueFull(): boolean {
        return (
            this.maxWaitSize !== null &&
            this.waitingCallers.length >= this.maxWaitSize
        );
    }

    /**
     * A client is treated as invalid when `validate` returns `false` or throws.
     */
    private async isClientUsable(client: TClient): Promise<boolean> {
        if (this.resourceFactory.validate === undefined) {
            return true;
        }
        try {
            return await this.resourceFactory.validate(client);
        } catch {
            return false;
        }
    }

    private async destroyClient(client: TClient): Promise<void> {
        this.resourceCount -= 1;
        await this.resourceFactory.destroy(client);
    }

    /**
     * The only place a caller is settled. A recycled client that fails validation is
     * destroyed and the caller goes back to the front of the queue.
     */
    private async handOver(
        client: TClient,
        caller: WaitingCaller<TClient>,
        isFresh: boolean,
    ): Promise<void> {
        this.borrowedClients.add(client);

        try {
            if (!isFresh && !(await this.isClientUsable(client))) {
                this.borrowedClients.delete(client);
                await this.destroyClient(client);
                if (this.isClosed) {
                    caller.reject(QueuePool.createPoolClosedError());
                    return;
                }
                this.waitingCallers.unshift(caller);
                this.dispense();
                return;
            }

            if (this.isClosed) {
                this.borrowedClients.delete(client);
                await this.destroyClient(client);
                caller.reject(QueuePool.createPoolClosedError());
                return;
            }

            caller.resolve(client);
        } catch (error) {
            this.borrowedClients.delete(client);
            caller.reject(error);
            this.dispense();
        }
    }

    private async createFor(caller: WaitingCaller<TClient>): Promise<void> {
        let client: TClient;
        try {
            client = await this.resourceFactory.create();
        } catch (error) {
            this.resourceCount -= 1;
            caller.reject(error);
            this.dispense();
            return;
        }
        await this.handOver(client, caller, true);
    }

    /**
     * Single scheduling point: pairs waiting callers with idle clients, then with
     * resources that are still within the configured capacity.
     */
    private dispense(): void {
        while (this.waitingCallers.length > 0 && this.idleClients.length > 0) {
            const client = this.idleClients.shift();
            const caller = this.waitingCallers.shift();
            if (client === undefined || caller === undefined) {
                return;
            }
            void this.handOver(client, caller, false);
        }

        while (
            this.waitingCallers.length > 0 &&
            this.resourceCount < this.maxResources
        ) {
            const caller = this.waitingCallers.shift();
            if (caller === undefined) {
                return;
            }
            this.resourceCount += 1;
            void this.createFor(caller);
        }
    }

    async run<TReturn>(
        fn: Invocable<[client: TClient], Promisable<TReturn>>,
    ): Promise<TReturn> {
        const client = await this.acquireOrFail();
        try {
            return await callInvocable(fn, client);
        } finally {
            await this.release(client);
        }
    }
}
