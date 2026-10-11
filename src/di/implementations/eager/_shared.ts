/**
 * @module DI
 */
import { LIFETIME } from "@/di/contracts/_module-exports.js";

import type {
    ServiceFactory,
    DiToken,
} from "@/di/contracts/_module-exports.js";

/**
 * @internal
 */
export type EdgeProps = {
    arg: string;
};

/**
 * @internal
 */
export type Edge = [Node, Node];
/**
 * @internal
 */
export type Node = DiToken;

/**
 * @internal
 */
export type DynamicNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.DYNAMIC;
};

/**
 * @internal
 */
export type ScopedNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.SCOPED;
    service: ServiceFactory;
};

/**
 * @internal
 */
export type TransientNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.TRANSIENT;
    service: ServiceFactory;
};

/**
 * @internal
 */
export type SingletonNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.SINGLETON;
    service: ServiceFactory;
};

/**
 * @internal
 */
export type NodeProps =
    | DynamicNodeProps
    | ScopedNodeProps
    | TransientNodeProps
    | SingletonNodeProps;

/**
 * @internal
 */
export const INTERNAL_LIFETIME = {
    ...LIFETIME,
    DYNAMIC: "dynamic",
} as const;

/**
 * @internal
 */
export type InternalLifetime =
    (typeof INTERNAL_LIFETIME)[keyof typeof INTERNAL_LIFETIME];
