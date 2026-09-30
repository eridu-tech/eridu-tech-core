---
"eridu-tech": minor
---

Reworked the DI container contracts: registrations can run their own lifecycle hooks, and dependencies can be marked as optional.

```ts
import { Container } from "eridu-tech/di";
import { genericToken, optionalToken, LIFETIME } from "eridu-tech/di/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

const CONFIG = genericToken<Config>("CONFIG");
const CACHE = genericToken<Cache>("CACHE");

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

container.registerFactory({
    token: CONFIG,
    // CACHE is optional: when it is never registered the factory receives
    // `undefined` instead of the graph failing validation.
    deps: { cache: optionalToken(CACHE) },
    factory: ({ cache }) => loadConfig(cache),
    lifetime: LIFETIME.SINGLETON,
    onInit: (config) => config.warmUp(),
    onDeInit: (config) => config.dispose(),
});

await container.init();
await container.deInit();
```

- Added `optionalToken(token)`, which creates an optional variant of a token. The variant is a distinct token, so the original stays a required dependency elsewhere: one service can require a dependency while another only optionally depends on it. An optional dependency that was never registered is dropped from the graph, so `container.init()` succeeds and the factory receives `undefined` for it (typed as `TRegisteredType | undefined`). Registered optional dependencies behave exactly like required ones, including lifetime/edge and cycle validation.
- Added per-registration lifecycle hooks: `FactoryRegistration` and `ValueRegistration` accept `onInit` / `onDeInit`, which receive the resolved service instance. `onInit` runs during `container.init()` once the service is available and `onDeInit` runs during `container.deInit()`. Hooks are only available on singleton registrations.
- Added the `ServiceHooks<TRegisteredType>`, `FactoryRegistrationBase<TDeps, TRegisteredType>`, `FactoryRegistrationSingleton<TDeps, TRegisteredType>` and `FactoryRegistrationNoneSingleton<TDeps, TRegisteredType>` types to `eridu-tech/di/contracts`. `FactoryRegistration` is now a union of the singleton variant (which carries the hooks) and the non-singleton variant.
- Renamed the `EmptyDepRecord` type to `EmptyRecord`.

### Breaking changes

- Removed the container-level lifecycle hooks: the `IContainerHooks` and `DiHook` types and the `Container.onContainerInit()` / `Container.onContainerDeInit()` methods. Use the per-registration `onInit` / `onDeInit` hooks instead.
- Removed the `FactoryRegistrationOverride` type. `container.overrideFactory()` now takes `FactoryRegistrationBase`, the dependency-injection settings shared by every factory registration.
- Renamed the exported `EmptyDepRecord` type to `EmptyRecord`, so imports of the old name no longer resolve.
- Removed the service-provider registration API (`IServiceProviderRegister`, `ServiceProviderFn`, `IServiceProvider`, `ServiceProvider` and `IServiceRegister.registerProvider`) as part of dropping the `providers` module; see the `removed-providers-module` changeset for the migration.

### Migration

Move container-level hooks onto the registration that owns the service:

**Before:**

```ts
container.registerFactory({
    token: CONFIG,
    deps: {},
    factory: () => createConfig(),
    lifetime: LIFETIME.SINGLETON,
});

container.onContainerInit(async (resolver) => {
    const config = await resolver.resolveOrFail(CONFIG);
    config.warmUp();
});

container.onContainerDeInit(async (resolver) => {
    const config = await resolver.resolveOrFail(CONFIG);
    config.dispose();
});
```

**After:**

```ts
container.registerFactory({
    token: CONFIG,
    deps: {},
    factory: () => createConfig(),
    lifetime: LIFETIME.SINGLETON,
    onInit: (config) => {
        config.warmUp();
    },
    onDeInit: (config) => {
        config.dispose();
    },
});
```
