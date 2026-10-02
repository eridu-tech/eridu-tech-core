/**
 * @module Module
 */

import type { DepRecord, EmptyRecord } from "@/di/contracts/_module-exports.js";
import type {
    ModuleFactoryRegistration,
    ModuleValueRegistration,
} from "@/module/contracts/module-definition.contract.js";

/**
 * The settings and inputs used to override a composed module.
 *
 * @typeParam TSettings - The composed module's settings record.
 * @typeParam TInputs - The composed module's input dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type OverrideModuleSettings<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
> = {
    /** The settings to use for the composed module. */
    settings: TSettings;

    /** The inputs to use for the composed module. */
    inputs: TInputs;
};

/**
 * The public contract of a module instance.
 *
 * A module exposes the registrations it overrides, the modules it composes
 * and the tokens it outputs, which are registered into an {@link IContainer}
 * by {@link IModule.register}.
 *
 * The generic parameters only carry the module's type information: they are
 * inferred when the module is passed to {@link IModule.overrideModule}, and
 * `TOutputs` is the record returned by {@link IModule.register}.
 *
 * @typeParam TSettings - The module's settings record.
 * @typeParam TInputs - The module's input dependency record.
 * @typeParam TOutputs - The module's output dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type IModule<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TSettings extends DepRecord = DepRecord,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TInputs extends DepRecord = DepRecord,
    TOutputs extends DepRecord = DepRecord,
> = {
    readonly outputs: Readonly<TOutputs>;

    /**
     * Overrides a factory registration of this module.
     *
     * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
     * @typeParam TRegisteredType - The type produced by the factory.
     * @param settings - The factory registration settings.
     */
    overrideFactory<
        TDeps extends DepRecord = EmptyRecord,
        TRegisteredType = unknown,
    >(
        settings: ModuleFactoryRegistration<TDeps, TRegisteredType>,
    ): void;

    /**
     * Overrides a value registration of this module.
     *
     * @typeParam TRegisteredType - The type of the value.
     * @param settings - The value registration settings.
     */
    overrideValue<TRegisteredType = unknown>(
        settings: ModuleValueRegistration<TRegisteredType>,
    ): void;

    /**
     * Overrides the settings and inputs of a module composed by this module.
     *
     * @typeParam TSettings_ - The composed module's settings record.
     * @typeParam TInputs_ - The composed module's input dependency record.
     * @typeParam TOutputs_ - The composed module's output dependency record.
     * @param blueprint - The composed module to override.
     * @param config - The settings and inputs to use instead.
     */
    overrideModule<
        TSettings_ extends DepRecord = EmptyRecord,
        TInputs_ extends DepRecord = EmptyRecord,
        TOutputs_ extends DepRecord = DepRecord,
    >(
        blueprint: IModule<TSettings_, TInputs_, TOutputs_>,
        config: OverrideModuleSettings<TSettings_, TInputs_>,
    ): void;
};
