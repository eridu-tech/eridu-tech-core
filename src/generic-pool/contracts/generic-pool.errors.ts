/**
 * @module GenericPool
 */

/**
 * The error is thrown when a client cannot be acquired from a generic pool.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool/contracts"`
 * @group Errors
 */
export class UnableToAcquireError extends Error {
    /**
     * Creates an `UnableToAcquireError`.
     *
     * @param message - The error message describing why the client could not be acquired.
     * @param cause - The original error that caused the failure, if any.
     * @returns A new `UnableToAcquireError` instance.
     */
    static create(message: string, cause?: unknown): UnableToAcquireError {
        return new UnableToAcquireError(message, cause);
    }

    /**
     * Note: Do not instantiate `UnableToAcquireError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToAcquireError.name;
    }
}
