/**
 * @module Module
 */

import { Module } from "@/module/implementations/module.js";

import type {
    DepRecord,
    EmptyRecord,
    IContainer,
} from "@/di/contracts/_module-exports.js";
import type {
    IModule,
    IModuleBlueprint,
    IModuleBuilder,
    ModuleDefinition,
} from "@/module/contracts/_module-exports.js";

/**
 * Extracts the settings record out of a {@link Module}.
 *
 * @typeParam TModule - The module to extract the settings record from.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export type InferModuleSettings<TModule extends Module<any, any, any>> =
    TModule extends Module<infer R, any, any> ? R : EmptyRecord;

/**
 * Extracts the input dependency record out of a {@link Module}.
 *
 * @typeParam TModule - The module to extract the input record from.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export type InferModuleInputs<TModule extends Module<any, any, any>> =
    TModule extends Module<any, infer R, any> ? R : EmptyRecord;

/**
 * Extracts the output dependency record out of a {@link Module}.
 *
 * @typeParam TModule - The module to extract the output record from.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export type InferModuleOutputs<TModule extends Module<any, any, any>> =
    TModule extends Module<any, any, infer R> ? R : EmptyRecord;

/**
 * The configuration of a module, describing its optional settings and inputs.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export type ModuleConfig<
    TSettings extends DepRecord = EmptyRecord,
    TInputs extends DepRecord = EmptyRecord,
> = {
    /** The settings declared for the module. */
    settings?: TSettings;

    /** The inputs declared for the module. */
    inputs?: TInputs;
};

/**
 * Extracts the `inputs` record out of a {@link ModuleConfig}, falling back
 * to {@link EmptyRecord} when no inputs are declared.
 *
 * @typeParam TConfig - The module configuration to extract inputs from.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export type ModuleInputs<TConfig extends ModuleConfig = ModuleConfig> =
    TConfig["inputs"] extends undefined
        ? EmptyRecord
        : NonNullable<TConfig["inputs"]>;

/**
 * Extracts the `settings` record out of a {@link ModuleConfig}, falling back
 * to {@link EmptyRecord} when no settings are declared.
 *
 * @typeParam TConfig - The module configuration to extract settings from.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export type ModuleSettings<TConfig extends ModuleConfig = ModuleConfig> =
    TConfig["settings"] extends undefined
        ? EmptyRecord
        : NonNullable<TConfig["settings"]>;

/**
 * Creates a {@link ModuleBlueprint} for the given module configuration.
 *
 * @typeParam TConfig - The module configuration, describing the module's
 * settings and inputs.
 *
 * IMPORT_PATH: `"eridu-tech/module"`
 * @group Implementations
 */
export function defineModule<
    TConfig extends ModuleConfig = EmptyRecord,
>(): IModuleBlueprint<ModuleSettings<TConfig>, ModuleInputs<TConfig>> {
    return {
        blueprint<TOutputs extends DepRecord = EmptyRecord>(
            moduleDefinition: ModuleDefinition<
                ModuleSettings<TConfig>,
                ModuleInputs<TConfig>,
                TOutputs
            >,
        ): IModuleBuilder<
            ModuleSettings<TConfig>,
            ModuleInputs<TConfig>,
            TOutputs
        > {
            return {
                build(
                    container: IContainer,
                ): IModule<
                    ModuleSettings<TConfig>,
                    ModuleInputs<TConfig>,
                    TOutputs
                > {
                    return new Module(moduleDefinition);
                },
            };
        },
    };
}

const module1 = defineModule().blueprint((args) => {
    return {
        a: args.value({
            value: "ad",
        }),
    };
});
const module2 = defineModule().blueprint((args) => {
    return {
        ...args.module(module1, {
            settings: {
                c: "",
            },
            inputs: {},
        }),
    };
});
