import {
    withCacheFactory,
    withInvalidationFactory,
} from "eridu-tech/cache/middlewares";
import { withTransactionFactory } from "eridu-tech/transaction-context/middlewares";
import { cache } from "./resolvers";

export const withCache = withCacheFactory(cache);
export const withInvalidation = withInvalidationFactory(cache);
