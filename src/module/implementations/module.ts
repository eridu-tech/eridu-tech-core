/**
 * @module Module
 */

import type { DepRecord, EmptyRecord } from "@/di/contracts/_module-exports.js";
import type {
    IModule,
    ModuleDefinition,
    ModuleFactoryRegistration,
    ModuleValueRegistration,
    OverrideModuleSettings,
} from "@/module/contracts/_module-exports.js";

/**
 * A module instance, wrapping the {@link ModuleDefinition} it was created
 * from and implementing {@link IModule}.
 *
 * @typeParam TSettings - The module's settings record.
 * @typeParam TInputs - The module's input dependency record.
 * @typeParam TOutputs - The module's output dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export class Module<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
    TOutputs extends DepRecord = DepRecord,
> implements IModule<TSettings, TInputs, TOutputs> {
    /**
     * @internal
     */
    constructor(
        private readonly moduleBlueprintDef: ModuleDefinition<
            TSettings,
            TInputs,
            TOutputs
        >,
    ) {}

    get outputs(): Readonly<TOutputs> {
        throw new Error("Method not implemented.");
    }

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
    >(settings: ModuleFactoryRegistration<TDeps, TRegisteredType>): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Overrides a value registration of this module.
     *
     * @typeParam TRegisteredType - The type of the value.
     * @param settings - The value registration settings.
     */
    overrideValue<TRegisteredType = unknown>(
        settings: ModuleValueRegistration<TRegisteredType>,
    ): void {
        throw new Error("Method not implemented.");
    }

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
        TOutputs_ extends DepRecord = Partial<Record<string, unknown>>,
    >(
        blueprint: IModule<TSettings_, TInputs_, TOutputs_>,
        config: OverrideModuleSettings<TSettings_, TInputs_>,
    ): void {
        throw new Error("Method not implemented.");
    }
}
