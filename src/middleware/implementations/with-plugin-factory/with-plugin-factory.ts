/**
 * @module Middleware
 */

import { enhance } from "@/middleware/implementations/enhance-factory/_module.js";
import {
    callInvocable,
    copyObj,
    resolveOneOrMore,
} from "@/utilities/_module-exports.js";

import type {
    Plugin,
    WithPlugin,
    Enhance,
} from "@/middleware/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export function withPluginFactory(enhance_: Enhance): WithPlugin {
    return <TInstance>(
        instance: TInstance,
        plugins: OneOrMore<Plugin<TInstance>>,
    ): TInstance => {
        const copyOfInstance = copyObj(instance);
        for (const plugin of resolveOneOrMore(plugins).reverse()) {
            callInvocable(plugin, copyOfInstance, enhance_);
        }
        return copyOfInstance;
    };
}

/**
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export const withPlugin = withPluginFactory(enhance);
