/**
 * @module Logger
 */

/**
 * The error is thrown when a transport fails to log an entry.
 * The original transport error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Errors
 */
export class UnableToLogError extends Error {
    static create(cause?: unknown): UnableToLogError {
        return new UnableToLogError("Unable to log entry", cause);
    }

    /**
     * Note: Do not instantiate `UnableToLogError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToLogError.name;
    }
}
