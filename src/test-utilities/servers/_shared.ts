import type {
    IAsyncInitizable,
    IAsyncDeinitizable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type ITestServer<TSettings> = IAsyncInitizable &
    IAsyncDeinitizable & {
        getSettings(): TSettings;
    };
