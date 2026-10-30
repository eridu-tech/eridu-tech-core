/**
 * @module Utilities
 */

/**
 * IMPORT_PATH: `"eridu-tech/process/contracts"`
 * @group Contracts
 */
export type Sink<TType> = {
    write(chunk: TType): Promise<void>;

    end(): Promise<void>;
};
