---
"eridu-tech": minor
---

Add `OtelLoggerTransport`, which forwards logger entries to an OpenTelemetry `Logger`, defaulting to `logs.getLogger("eridu-tech")`.

- Levels map to OTel severity numbers, with `verbose` mapped to `TRACE`, and the level name is sent as `severityText`.
- Logged values become the record `body`.
- `group`, `metadata`, `error`, and spans in milliseconds are attached as attributes.

Requires the optional `@opentelemetry/api` peer dependency.
