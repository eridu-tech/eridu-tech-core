/**
 * @module Utilities
 */

/**
 * Builds a hint listing the adapters that are available, so error messages can
 * point to the valid names.
 */
function availableAdaptersHint(availableAdapters: Array<string>): string {
    if (availableAdapters.length === 0) {
        return " No adapters are registered.";
    }
    return ` Available adapters: ${availableAdapters
        .map((adapter) => `"${adapter}"`)
        .join(", ")}.`;
}

/**
 * The error occurs when attempting to access the default adapter of the `Factory` class instance, which has not been defined.
 *
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Errors
 */
export class DefaultAdapterNotDefinedError extends Error {
    constructor(factoryName: string, availableAdapters: Array<string> = []) {
        super(
            `No default adapter is defined for "${factoryName}". Pass an adapter name to use(), or define a "defaultAdapter".` +
                availableAdaptersHint(availableAdapters),
        );
        this.name = DefaultAdapterNotDefinedError.name;
    }
}

/**
 * The error occurs when attempting to access an adapter of the `Factory` class instance, which has not been registered.
 *
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Errors
 */
export class UnregisteredAdapterError extends Error {
    constructor(adapterName: string, availableAdapters: Array<string> = []) {
        super(
            `Adapter "${adapterName}" is not registered.` +
                availableAdaptersHint(availableAdapters),
        );
        this.name = UnregisteredAdapterError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Errors
 */
export class UnexpectedError extends Error {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnexpectedError.name;
    }
}
