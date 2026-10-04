import { LIFETIME } from "eridu-tech/di/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { withPlugin } from "eridu-tech/middleware";
import { container } from "./eridu/_module";
import { UserController } from "./2-controller";
import { UserService } from "./3-service";
import { enhanceUserService } from "./4-aop";
import { Kysely } from "kysely";
import { Tables } from "./tables";


container.registerFactory({
    token: UserService,
    factory: (deps) => {
        return withPlugin(
            new UserService(
                deps.transactionConnection as TransactionContext<
                    Kysely<Tables>
                >,
            ),
            enhanceUserService
        );
    },
    deps: {
        transactionConnection: TransactionContext,
    },
    lifetime: LIFETIME.SINGLETON,
});

container.registerFactory({
    token: UserController,
    factory: (deps) => {
        return new UserController(deps.userService);
    },
    deps: {
        userService: UserService,
    },
    lifetime: LIFETIME.SINGLETON,
});
