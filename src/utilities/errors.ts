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
    static create(
        factoryName: string,
        availableAdapters: Array<string> = [],
        cause?: unknown,
    ): DefaultAdapterNotDefinedError {
        return new DefaultAdapterNotDefinedError(
            `No default adapter is defined for "${factoryName}". Pass an adapter name to use(), or define a "defaultAdapter".` +
                availableAdaptersHint(availableAdapters),
            cause,
        );
    }

    /**
     * Note: Do not instantiate `DefaultAdapterNotDefinedError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
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
    static create(
        adapterName: string,
        availableAdapters: Array<string> = [],
        cause?: unknown,
    ): UnregisteredAdapterError {
        return new UnregisteredAdapterError(
            `Adapter "${adapterName}" is not registered.` +
                availableAdaptersHint(availableAdapters),
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnregisteredAdapterError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnregisteredAdapterError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Errors
 */
export class UnexpectedError extends Error {
    static create(message: string, cause?: unknown): UnexpectedError {
        return new UnexpectedError(message, cause);
    }

    /**
     * Note: Do not instantiate `UnexpectedError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnexpectedError.name;
    }
}
