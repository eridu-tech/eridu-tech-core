/**
 * @module Secret
 */

/**
 * A value wrapper that hides sensitive data from logs and string conversion.
 *
 * A secret always renders as `"[redacted]"`, so it can be interpolated,
 * logged or inspected safely. The real value is only reachable through `get()`.
 *
 * @template TValue - Type of the wrapped value.
 *
 * IMPORT_PATH: `"eridu-tech/secret/contracts"`
 * @group Contracts
 */
export type ISecret<TValue = unknown> = {
    /**
     * Returns the redacted placeholder `"[redacted]"`, never the wrapped value.
     */
    toString(): string;

    /**
     * Returns the wrapped value.
     *
     * @returns The unredacted secret value.
     */
    get(): TValue;
};
