/**
 * @module Module
 */

import type { DepRecord, IContainer } from "@/di/contracts/_module-exports.js";
import type { ModuleDefinition } from "@/module/contracts/module-definition.contract.js";
import type { IModule } from "@/module/contracts/module.contract.js";

/**
 * A blueprint result that builds a {@link IModule} for a given container.
 *
 * @typeParam TSettings - The module's settings record.
 * @typeParam TInputs - The module's input dependency record.
 * @typeParam TOutputs - The module's output dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Implementations
 */
export type IModuleBuilder<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
    TOutputs extends DepRecord = DepRecord,
> = {
    /**
     * Builds the module instance for the given container.
     *
     * @param container - The container to build the module within.
     * @returns The built module.
     */
    build(container: IContainer): IModule<TSettings, TInputs, TOutputs>;
};

/**
 * Factory object returned by {@link defineModule}, exposing
 * {@link IModuleBlueprint.blueprint} for a module configuration.
 *
 * @typeParam TSettings - The module's settings record.
 * @typeParam TInputs - The module's input dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Implementations
 */
export type IModuleBlueprint<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
> = {
    /**
     * Creates a {@link IModule} from a blueprint definition.
     *
     * @typeParam TOutputs - The module's output dependency record.
     * @param moduleDefinition - The blueprint definition to wrap.
     * @returns A module wrapping the given blueprint definition.
     */
    blueprint<TOutputs extends DepRecord = DepRecord>(
        moduleDefinition: ModuleDefinition<TSettings, TInputs, TOutputs>,
    ): IModuleBuilder<TSettings, TInputs, TOutputs>;
};
