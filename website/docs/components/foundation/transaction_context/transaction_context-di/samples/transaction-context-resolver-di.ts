import { genericToken, LIFETIME } from "eridu-tech/di/contracts";
import { ProxyTransactionContextResolver } from "eridu-tech/transaction-context/di";
import { TransactionContextResolver } from "eridu-tech/transaction-context";
import { container, executionContext } from "./container.js";
import { mongodbTransactionAdapter } from "./mongodb-transaction-adapter.js";
import { sqliteTransactionAdapter } from "./sqlite-transaction-adapter.js";

type Adapters = "primary" | "secondary";

const resolverToken = genericToken<TransactionContextResolver<Adapters>>(
    "transactionContextResolver",
);

container.registerFactory({
    token: resolverToken,
    factory: () =>
        new TransactionContextResolver<Adapters>({
            adapters: {
                primary: mongodbTransactionAdapter,
                secondary: sqliteTransactionAdapter,
            },
            defaultAdapter: "primary",
            executionContext,
        }),
    onInit: async (resolver) => {
        await resolver.init();
    },
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

// Create the proxy before container.init()
export const transactionContext = new ProxyTransactionContextResolver<Adapters>(
    {
        container,
        resolverToken,
    },
);

await container.init();
