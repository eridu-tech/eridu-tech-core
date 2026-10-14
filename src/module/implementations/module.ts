/**
 * @module Module
 */

import { genericToken } from "@/di/contracts/_module-exports.js";
import {
    callInvocable,
    getConstructorName,
} from "@/utilities/_module-exports.js";

import type {
    DepRecord,
    DepsTokens,
    EmptyRecord,
    IContainer,
} from "@/di/contracts/_module-exports.js";
import type { GenericToken } from "@/execution-context/contracts/execution-context.contract.js";
import type {
    IModule,
    IModuleBuilder,
    ModuleArgs,
    ModuleAliasRegistration,
    ModuleCompositionConfig,
    ModuleDefinition,
    ModuleDynamicRegistration,
    ModuleFactoryRegistration,
    ModuleValueRegistration,
    OverrideModuleSettings,
} from "@/module/contracts/_module-exports.js";

/**
 * @internal
 */
class ModuleArgsImpl<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
> implements ModuleArgs<TSettings, TInputs> {
    constructor(
        private readonly config: ModuleCompositionConfig<TSettings, TInputs>,
        private readonly container: IContainer,
        private readonly moduleName: string,
    ) {}

    private getServiceName(serviceName: string | undefined): string {
        return [this.moduleName, serviceName]
            .filter((str) => str !== undefined)
            .join("/");
    }

    factory<TDeps extends DepRecord = EmptyRecord, TRegisteredType = unknown>(
        settings: ModuleFactoryRegistration<TDeps, TRegisteredType>,
    ): GenericToken<TRegisteredType> {
        console.log(settings.testId);
        const token = genericToken<TRegisteredType>(
            this.getServiceName(settings.name),
        );
        this.container.registerFactory({
            token,
            ...settings,
        });
        return token;
    }

    value<TRegisteredType = unknown>(
        settings: ModuleValueRegistration<TRegisteredType>,
    ): GenericToken<TRegisteredType> {
        const token = genericToken<TRegisteredType>(
            this.getServiceName(settings.name),
        );
        this.container.registerValue({
            token,
            ...settings,
        });
        return token;
    }

    dynamic<TRegisteredType = unknown>(
        settings?: ModuleDynamicRegistration<TRegisteredType>,
    ): GenericToken<TRegisteredType> {
        console.log(settings?.testId);
        const token = genericToken<TRegisteredType>(
            this.getServiceName(settings?.name),
        );
        this.container.registerDynamic(token);
        return token;
    }

    alias<TRegisteredType = unknown>(
        settings: ModuleAliasRegistration<TRegisteredType>,
    ): GenericToken<TRegisteredType> {
        console.log(settings.testId);
        const token = genericToken<TRegisteredType>(
            this.getServiceName(settings.name),
        );
        this.container.registerAlias({
            target: settings.target,
            alias: token,
        });
        return token;
    }

    module<
        TSettings_ extends DepRecord = EmptyRecord,
        TInputs_ extends DepRecord = EmptyRecord,
        TOutputs extends DepRecord = EmptyRecord,
    >(
        moduleBuilder: IModuleBuilder<TSettings_, TInputs_, TOutputs>,
        moduleConfig: ModuleCompositionConfig<TSettings_, TInputs_>,
    ): DepsTokens<TOutputs> {
        return moduleBuilder.build(this.container, moduleConfig).outputs;
    }

    get settings(): TSettings {
        return this.config.settings;
    }

    get inputs(): DepsTokens<TInputs> {
        return this.config.inputs;
    }
}

/**
 * @internal
 */
export class Module<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
    TOutputs extends DepRecord = DepRecord,
> implements IModule<TSettings, TInputs, TOutputs> {
    readonly outputs: Readonly<DepsTokens<TOutputs>>;

    /**
     * @internal
     */
    constructor(
        config: ModuleCompositionConfig<TSettings, TInputs>,
        container: IContainer,
        moduleBlueprintDef: ModuleDefinition<TSettings, TInputs, TOutputs>,
    ) {
        this.outputs = callInvocable(
            moduleBlueprintDef,
            new ModuleArgsImpl(config, container, getConstructorName(this)),
        );
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
    >(_settings: ModuleFactoryRegistration<TDeps, TRegisteredType>): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Overrides a value registration of this module.
     *
     * @typeParam TRegisteredType - The type of the value.
     * @param settings - The value registration settings.
     */
    overrideValue<TRegisteredType = unknown>(
        _settings: ModuleValueRegistration<TRegisteredType>,
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
        _blueprint: IModule<TSettings_, TInputs_, TOutputs_>,
        _config: OverrideModuleSettings<TSettings_, TInputs_>,
    ): void {
        throw new Error("Method not implemented.");
    }
}
