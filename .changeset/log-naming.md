---
"eridu-tech": minor
---

The logger module uses the `Log` naming: `Log`, `LogSettings`, `LogSettingsBase`, `ILog`, `ILogTransport`, `ILogResolver`, `LogResolver`, `LogResolverSettings`, `LogTransports`, `ComposedLog`, `ProxyLogResolver`, `ProxyLogResolverSettings` and `ProxyLog`.

The transports are named `ConsoleLogTransport`, `LogLayerLogTransport`, `MemoryLogTransport`, `NoOpLogTransport` and `OtelLogTransport`, with the `LogLayerLogTransportSettings.log` and `OtelLogTransportSettings.log` settings holding the backend instance. The transport entry points are `eridu-tech/log/console-log-transport`, `eridu-tech/log/loglayer-log-transport`, `eridu-tech/log/memory-log-transport`, `eridu-tech/log/no-op-log-transport` and `eridu-tech/log/otel-log-transport`.
