---
"eridu-tech": minor
---

Reworked the DI container contracts: dependencies can be marked as optional, registrations can run their own lifecycle hooks, and container-wide hooks can now declare the dependencies they need as tokens.

```ts
import { Container } from "eridu-tech/di";
import { genericToken, optionalToken, LIFETIME } from "eridu-tech/di/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

const CONFIG = genericToken<Config>("CONFIG");
const CACHE = genericToken<Cache>("CACHE");

const container = new Container({
    executionContext: new ExecutionContext(new AlsExecutionContextAdapter()),
});

// Container-wide hooks can declare the tokens they need; the container resolves
// them before the listener runs.
container.onInit({ config: CONFIG }, ({ config }) => config.warmUp());
container.onDeInit({ config: CONFIG }, ({ config }) => config.dispose());

container.registerFactory({
    token: CONFIG,
    // CACHE is optional: when it is never registered the factory receives
    // `undefined` instead of the graph failing validation.
    deps: { cache: optionalToken(CACHE) },
    factory: ({ cache }) => loadConfig(cache),
    lifetime: LIFETIME.SINGLETON,
    // Per-registration hooks receive the resolved service instance.
    onInit: (config) => config.warmUp(),
});

await container.init();
await container.deInit();
```

## Added

- **Optional dependencies.** `optionalToken(token)` creates an optional variant of a token. The variant is a distinct token, so the original stays a required dependency elsewhere: one service can require a dependency while another only optionally depends on it. An optional dependency that was never registered is dropped from the graph, so `container.init()` succeeds and the factory receives `undefined` for it (typed as `TRegisteredType | undefined`). Registered optional dependencies behave exactly like required ones, including lifetime/edge and cycle validation.
- **Per-registration lifecycle hooks.** `FactoryRegistration` and `ValueRegistration` accept `onInit` / `onDeInit`, which receive the resolved service instance. `onInit` runs during `container.init()` once the service is available, and `onDeInit` runs during `container.deInit()`. Hooks are only available on singleton registrations.
- **Declarative container hook listeners.** `container.onInit(...)` and `container.onDeInit(...)` now accept a dependency record of `DiToken`s next to the listener — `container.onInit({ config: CONFIG }, ({ config }) => ...)` — so the container resolves those tokens first and passes them to the listener. The record supports required and `optionalToken` dependencies. `container.onInit(listener)` / `container.onDeInit(listener)` register a listener that needs no dependencies. Hook execution is otherwise unchanged: registration order, `onInit` during `container.init()` and `onDeInit` during `container.deInit()`, no registration after `container.init()` or inside a run scope, a rejecting `onInit` leaves the container terminated, and `onDeInit` runs every hook even if one rejects.
- Added the `ContainerListener<TDeps>` and `EmptyListener` types to `eridu-tech/di/contracts`.
- Added the `ServiceHooks<TRegisteredType>`, `FactoryRegistrationBase<TDeps, TRegisteredType>`, `FactoryRegistrationSingleton<TDeps, TRegisteredType>`, and `FactoryRegistrationNoneSingleton<TDeps, TRegisteredType>` types to `eridu-tech/di/contracts`. `FactoryRegistration` is now a union of the singleton variant (which carries the hooks) and the non-singleton variant.
- Renamed the `EmptyDepRecord` type to `EmptyRecord`.

## Breaking changes

- Renamed the container-wide hooks: `IContainerHooks.onContainerInit()` and `onContainerDeInit()` are now `onInit()` and `onDeInit()`, and their listeners receive the resolved dependencies instead of the container's service resolver. `IContainerHooks` also moved off `IServiceRegister` and onto `IContainer`, so the hooks are registered on the container itself.
- The `DiHook` type is no longer exported from `eridu-tech/di/contracts`; hook listeners are typed by `ContainerListener<TDeps>` and `EmptyListener`.
- Removed the `FactoryRegistrationOverride` type. `container.overrideFactory()` now takes `FactoryRegistrationBase`, the dependency-injection settings shared by every factory registration.
- Renamed the exported `EmptyDepRecord` type to `EmptyRecord`, so imports of the old name no longer resolve.
- Removed the service-provider registration API (`IServiceProviderRegister`, `ServiceProviderFn`, `IServiceProvider`, `ServiceProvider`, and `IServiceRegister.registerProvider`) as part of dropping the `providers` module; see the `removed-providers-module` changeset for the migration.

## Migration

### Container-wide hooks

Declare the tokens the hook needs instead of resolving them from the container.

**Before:**

```ts
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
container.onInit({ config: CONFIG }, ({ config }) => {
    config.warmUp();
});

container.onDeInit({ config: CONFIG }, ({ config }) => {
    config.dispose();
});
```

### Per-registration hooks

Move hooks that belong to a single service onto its registration.

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
