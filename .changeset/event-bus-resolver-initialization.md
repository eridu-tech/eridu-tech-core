---
"eridu-tech": minor
---

`EventBusResolver` now creates and retains one event bus per registered adapter during `init()`. Register listeners with `addListener()` before the application starts; each listener is attached to every configured adapter. `use()` returns a dispatcher for the selected adapter and uses `defaultAdapter` when no adapter name is supplied.

The new `ProxyEventBusResolver` is available from `eridu-tech/event-bus/di`. It resolves the registered resolver from the DI container and returns lightweight dispatchers. Register the resolver as a singleton, and call the proxy's `addListener()` before `container.init()`.

### Breaking changes

- `IEventBusResolver.use()` now returns `IEventDispatcher` rather than a listenable `IEventBus`; register listeners on the resolver with `addListener()`.
- `EventBusResolver.setEventMapType()` and `setEventMapSchema()` were removed. Configure the event map type and schema when constructing the resolver.
