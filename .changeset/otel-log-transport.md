---
"eridu-tech": minor
---

Add `OtelLogTransport`, which forwards log entries to an OpenTelemetry `Log`, defaulting to `logs.getLogger("eridu-tech")`.

- Levels map to OTel severity numbers, with `verbose` mapped to `TRACE`, and the level name is sent as `severityText`.
- Logged values become the record `body`.
- `group`, `metadata`, `error`, and spans in milliseconds are attached as attributes.

Requires the optional `@opentelemetry/api` peer dependency.
