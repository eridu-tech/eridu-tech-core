import { LIFETIME, type IServiceRegister } from "eridu-tech/di/contracts";
import { container } from "./container.js";
import { Database } from "./database.js";
import { FileLogger, Logger } from "./logger.js";
import { UserProvider } from "./user-provider.js";

// A plain function that groups related registrations
function registerLogging(register: IServiceRegister): void {
    register.registerFactory({
        token: Logger,
        factory: () => new Logger(),
        deps: {},
        lifetime: LIFETIME.SINGLETON,
    });

    register.registerFactory({
        token: FileLogger,
        factory: () => new FileLogger(),
        deps: {},
        lifetime: LIFETIME.SINGLETON,
    });
}

function registerDatabase(register: IServiceRegister): void {
    register.registerFactory({
        token: Database,
        factory: () => new Database(),
        deps: {},
        lifetime: LIFETIME.SINGLETON,
    });

    register.registerFactory({
        token: UserProvider,
        factory: ({ db }) => new UserProvider(db),
        deps: { db: Database },
        lifetime: LIFETIME.SCOPED,
    });
}

// The container implements IServiceRegister, so pass it directly
registerLogging(container);
registerDatabase(container);
