import { genericToken } from "eridu-tech/di/contracts";
import { container } from "./container.js";
import { IDATABASE } from "./generic-token.js";
import type { IDatabase } from "./idatabase.js";

// An alternative token for the same `IDatabase` service
const DATABASE_ALIAS = genericToken<IDatabase>(
    "Alias for the database service",
);

container.registerAlias({
    target: IDATABASE,
    alias: DATABASE_ALIAS,
});
