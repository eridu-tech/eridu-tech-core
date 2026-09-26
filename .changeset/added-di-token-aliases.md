---
"eridu-tech": minor
---

Added token aliases to the DI container, so an existing service can be resolved through additional tokens.

```ts
import { Container } from "eridu-tech/di";
import { genericToken } from "eridu-tech/di/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const IDATABASE = genericToken<IDatabase>("Database service");
const DATABASE_ALIAS = genericToken<IDatabase>(
    "Alias for the database service",
);

container.registerAlias({
    target: IDATABASE,
    alias: DATABASE_ALIAS,
});
```

- `container.registerAlias({ target, alias })` registers `alias` as another token for the service registered under `target`, so resolving either token returns the same instance.
- `eridu-tech/di/contracts` exports the `AliasRegistration<TRegisteredType>` type used by the new method.
- An alias is registered as a `Singleton` service that depends on its target, so the target must be a singleton (a value registered with `registerValue()` qualifies).
