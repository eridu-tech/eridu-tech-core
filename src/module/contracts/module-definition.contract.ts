/**
 * @module Module
 */

import type {
    DepRecord,
    DepsTokens,
    EmptyRecord,
    LIFETIME,
    ServiceFactory,
    ServiceHooks,
} from "@/di/contracts/_module-exports.js";
import type { GenericToken } from "@/execution-context/contracts/_module-exports.js";
import type { IModuleBuilder } from "@/module/contracts/module-blueprint.contract.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Shared fields of every factory-based module registration.
 *
 * A factory registration pairs a {@link ServiceFactory} with the tokens of
 * the dependencies it consumes, so the module can resolve those dependencies
 * and inject them into the factory.
 *
 * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
 * @typeParam TRegisteredType - The type produced by the factory.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleFactoryRegistrationBase<
    TDeps extends DepRecord = DepRecord,
    TRegisteredType = unknown,
> = {
    /** The factory function that creates the service instance. */
    factory: ServiceFactory<TDeps, TRegisteredType>;

    /** The dependency tokens to resolve and inject into the factory. */
    deps: DepsTokens<TDeps>;

    /**
     * Optional token that identifies this registration, so it can be reached
     * from tests.
     */
    testId?: GenericToken<TRegisteredType>;
};

/**
 * Factory registration that is resolved once and shared for the lifetime of
 * the container.
 *
 * Extends {@link ModuleFactoryRegistrationBase | `ModuleFactoryRegistrationBase`} with the
 * optional {@link ServiceHooks} lifecycle hooks and pins `lifetime` to
 * `"singleton"`.
 *
 * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
 * @typeParam TRegisteredType - The type produced by the factory.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleFactoryRegistrationSingleton<
    TDeps extends DepRecord = DepRecord,
    TRegisteredType = unknown,
> = ServiceHooks<TRegisteredType> &
    ModuleFactoryRegistrationBase<TDeps, TRegisteredType> & {
        /** The lifetime of the registration, always `"singleton"`. */
        lifetime: (typeof LIFETIME)["SINGLETON"];
    };

/**
 * Factory registration that is not a singleton, meaning either `"transient"`
 * (a new instance per resolution) or `"scoped"` (a single instance per run
 * scope).
 *
 * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
 * @typeParam TRegisteredType - The type produced by the factory.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleFactoryRegistrationNoneSingleton<
    TDeps extends DepRecord = DepRecord,
    TRegisteredType = unknown,
> = ModuleFactoryRegistrationBase<TDeps, TRegisteredType> & {
    /** The lifetime of the registration, either `"transient"` or `"scoped"`. */
    lifetime: (typeof LIFETIME)["TRANSIENT"] | (typeof LIFETIME)["SCOPED"];
};

/**
 * The factory registration settings accepted by
 * {@link ModuleRegister.factory}.
 *
 * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
 * @typeParam TRegisteredType - The type produced by the factory.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleFactoryRegistration<
    TDeps extends DepRecord = DepRecord,
    TRegisteredType = unknown,
> =
    | ModuleFactoryRegistrationSingleton<TDeps, TRegisteredType>
    | ModuleFactoryRegistrationNoneSingleton<TDeps, TRegisteredType>;

/**
 * The value registration settings accepted by
 * {@link ModuleRegister.value}.
 *
 * Value registrations are always resolved as singletons and may declare the
 * optional {@link ServiceHooks} lifecycle hooks.
 *
 * @typeParam TRegisteredType - The type of the value.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleValueRegistration<TRegisteredType = unknown> =
    ServiceHooks<TRegisteredType> & {
        /** The pre-constructed value to register. */
        value: TRegisteredType;

        /**
         * Optional token that identifies this registration, so it can be
         * reached from tests.
         */
        testId?: GenericToken<TRegisteredType>;
    };

/**
 * The dynamic registration settings accepted by
 * {@link ModuleRegister.dynamic}.
 *
 * A dynamic registration only reserves a token; its value is supplied at
 * runtime instead of by a factory or a pre-constructed value.
 *
 * @typeParam TRegisteredType - The type of the value provided at runtime.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleDynamicRegistration<TRegisteredType = unknown> = {
    /**
     * Optional token that identifies this registration, so it can be reached
     * from tests.
     */
    testId?: GenericToken<TRegisteredType>;
};

/**
 * The alias registration settings accepted by
 * {@link ModuleRegister.alias}.
 *
 * @typeParam TRegisteredType - The type of the aliased service.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleAliasRegistration<TRegisteredType = unknown> = {
    /** The token of the existing service to alias. */
    target: GenericToken<TRegisteredType>;

    /**
     * Optional token that identifies this registration, so it can be reached
     * from tests.
     */
    testId?: GenericToken<TRegisteredType>;
};

/**
 * The configuration accepted by {@link ModuleRegister.module} when composing
 * another module.
 *
 * `settings` carries the composed module's own configuration, while `inputs`
 * carries the tokens of the dependencies it consumes. Each field is omitted
 * entirely when the record it describes is empty, so a module that declares
 * no settings or no inputs can be composed without naming them.
 *
 * @typeParam TSettings - The composed module's settings record.
 * @typeParam TInputs - The composed module's input dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleCompositionConfig<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
> = {
    settings: TSettings;
    inputs: DepsTokens<TInputs>;
};

/**
 * Registration and composition API handed to a {@link ModuleDefinition}.
 *
 * The registration methods create services and return the token that
 * identifies each of them, so the token can be exported by the module or
 * referenced by other registrations of the same module. The composition
 * methods return the output tokens of other modules instead.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleRegister = {
    /**
     * Registers a factory-built service.
     *
     * @typeParam TDeps - Record of dependency names mapped to the types the factory consumes.
     * @typeParam TRegisteredType - The type produced by the factory.
     * @param settings - The factory registration settings.
     * @returns The token identifying the registered service.
     */
    factory<TDeps extends DepRecord = EmptyRecord, TRegisteredType = unknown>(
        settings: ModuleFactoryRegistration<TDeps, TRegisteredType>,
    ): GenericToken<TRegisteredType>;

    /**
     * Registers a pre-constructed value as a service, which is always
     * resolved as a singleton.
     *
     * @typeParam TRegisteredType - The type of the value.
     * @param settings - The value registration settings.
     * @returns The token identifying the registered service.
     */
    value<TRegisteredType = unknown>(
        settings: ModuleValueRegistration<TRegisteredType>,
    ): GenericToken<TRegisteredType>;

    /**
     * Registers a token whose value is provided dynamically at runtime.
     *
     * @typeParam TRegisteredType - The type of the value provided at runtime.
     * @param settings - The optional dynamic registration settings.
     * @returns The token identifying the registered service.
     */
    dynamic<TRegisteredType = unknown>(
        settings?: ModuleDynamicRegistration<TRegisteredType>,
    ): GenericToken<TRegisteredType>;

    /**
     * Registers a token as an alias of an existing service, so resolving the
     * alias resolves the same service as its `target`.
     *
     * @typeParam TRegisteredType - The type of the aliased service.
     * @param settings - The alias registration settings.
     * @returns The token identifying the aliased service.
     */
    alias<TRegisteredType = unknown>(
        settings: ModuleAliasRegistration<TRegisteredType>,
    ): GenericToken<TRegisteredType>;

    /**
     * Composes another {@link IModule} into this module, running its
     * blueprint with the given `settings` and returning its output tokens.
     *
     * @typeParam TSettings_ - The composed module's settings record.
     * @typeParam TInputs_ - The composed module's input dependency record.
     * @typeParam TOutputs - The composed module's output dependency record.
     * @param blueprint - The module to compose.
     * @param moduleConfig - The settings and inputs passed to the composed module.
     * @returns The tokens output by the composed module.
     */
    module<
        TSettings_ extends DepRecord = EmptyRecord,
        TInputs_ extends DepRecord = EmptyRecord,
        TOutputs extends DepRecord = EmptyRecord,
    >(
        blueprint: IModuleBuilder<TSettings_, TInputs_, TOutputs>,
        moduleConfig: ModuleCompositionConfig<TSettings_, TInputs_>,
    ): DepsTokens<TOutputs>;
};

/**
 * Arguments received by a {@link ModuleDefinition}.
 *
 * In addition to the registration API of {@link ModuleRegister}, a blueprint
 * receives the tokens of the module's inputs (`inputs`) and the module's own
 * configuration (`settings`).
 *
 * @typeParam TInputs - The module's input dependency record.
 * @typeParam TSettings - The module's settings record.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleArgs<
    TInputs extends DepRecord = DepRecord,
    TSettings extends DepRecord = DepRecord,
> = ModuleRegister & {
    /** The settings configured for the module. */
    settings: TSettings;

    /** The tokens of the dependencies provided to the module. */
    inputs: DepsTokens<TInputs>;
};

/**
 * The blueprint callback of a module.
 *
 * Receives the module {@link ModuleArgs | `ModuleArgs`} and returns the
 * tokens of the services the module outputs, which become the module's public
 * output record.
 *
 * @typeParam TSettings - The module's settings record.
 * @typeParam TInputs - The module's input dependency record.
 * @typeParam TOutputs - The module's output dependency record.
 *
 * IMPORT_PATH: `"eridu-tech/module/contracts"`
 * @group Contracts
 */
export type ModuleDefinition<
    TSettings extends DepRecord = DepRecord,
    TInputs extends DepRecord = DepRecord,
    TOutputs extends DepRecord = DepRecord,
> = Invocable<[args: ModuleArgs<TInputs, TSettings>], DepsTokens<TOutputs>>;
