import { CanNotResolveServiceDiError } from "eridu-tech/di/contracts";
import { container } from "./container.js";
import { Log } from "./log.js";

await container.init();

// Throws CanNotResolveServiceDiError if Log is not registered
try {
    container.resolveOrFail(Log);
} catch (error) {
    if (error instanceof CanNotResolveServiceDiError) {
        console.error(error);
    } else {
        throw error;
    }
}
