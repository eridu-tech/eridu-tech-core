import { afterEach, describe, expect, test, vi } from "vitest";

import { defaultWaitUntil } from "@/utilities/functions/default-wait-until.js";
import { callInvocable } from "@/utilities/functions/invocable.js";

function flushPromises(): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
    });
}

describe("function: defaultWaitUntil", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Should not log when the promise fulfills", async () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        callInvocable(defaultWaitUntil, Promise.resolve("value"));
        await flushPromises();

        expect(errorSpy).not.toHaveBeenCalled();
    });
    test("Should log the error when the promise rejects", async () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        const error = new Error("failed");

        callInvocable(defaultWaitUntil, Promise.reject(error));

        await vi.waitFor(() => {
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                "Unhandled promise rejection:",
                error,
            );
        });
    });
    test("Should not rethrow the rejection", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        const promise = Promise.reject(new Error("failed"));
        callInvocable(defaultWaitUntil, promise);

        await expect(promise).rejects.toThrow("failed");
    });
});
