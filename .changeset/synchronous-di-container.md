---
"eridu-tech": minor
---

The dependency-injection container now resolves services synchronously.

`IServiceResolver.resolve()`, `resolveOr()`, `resolveOrFail()` and `has()` return their results directly instead of a `Promise`, and `IDynamicServiceRegister.get()`, `getOrFail()` and `has()` are synchronous as well. Service factories are invoked during the resolution call, so errors they throw propagate synchronously rather than rejecting a promise:

```ts
const logger = container.resolveOrFail(LOGGER);
const hasLogger = container.has(LOGGER);
```

`ServiceFactory` now returns `TRegisteredType` instead of `Promisable<TRegisteredType>`, so factories must be synchronous:

```ts
container.registerFactory({
    token: CONFIG,
    factory: () => ({ apiUrl: "https://api.example.com", timeout: 5000 }),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});
```

Lifecycle hooks remain asynchronous: `onInit` and `onDeInit` still accept `Promisable<void>`. Their hook argument now uses `NoInfer<TRegisteredType>`, so it is inferred from the registration instead of widening the registered type.

### Breaking changes

- `IServiceResolver.resolve()`, `resolveOr()`, `resolveOrFail()` and `has()` no longer return a `Promise`; awaiting their results still works, but chaining `.then()`/`.catch()` does not.
- `IDynamicServiceRegister.get()`, `getOrFail()` and `has()` no longer return a `Promise`.
- `ServiceFactory` must return the service instance synchronously, so `async` factories no longer type-check. Perform asynchronous setup in the service itself or in an `onInit` hook after construction.
