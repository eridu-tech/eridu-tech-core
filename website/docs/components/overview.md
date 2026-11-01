---
sidebar_position: 0
sidebar_label: Overview
pagination_label: Components
---

# Components

`eridu-tech` ships a growing collection of officially maintained components,
grouped into the categories below. Every component is adapter-first: it comes
with in-memory adapters for fast, deterministic tests and pluggable adapters
for real infrastructure, so you can swap providers without touching your
business logic.

Each category has its own overview page that lists the components it ships and
links to their guides.

## Categories

- [**Foundation**](/docs/components/foundation/overview) — the building blocks
  the rest of the ecosystem is built on: dependency injection, middleware and
  AOP, serialization, execution context, configuration and environment access,
  and transaction context.
- [**Web**](/docs/components/web/overview) — framework-agnostic HTTP routing
  built on the Winter TC fetch standard.
- [**Storage**](/docs/components/storage/overview) — caching and file storage
  with pluggable stores, adapters, and plugins.
- [**Messaging**](/docs/components/messaging/overview) — a pub/sub event bus
  for dispatching and listening to events independent of the transport.
- [**Reliability**](/docs/components/reliability/overview) — resilience
  primitives such as timeout, retry, fallback, circuit breaker, and rate
  limiting.
- [**Concurrency**](/docs/components/concurrency/overview) — locks, shared
  locks, and semaphores for coordinating concurrent access to shared resources.
- [**Utilities**](/docs/components/utilities/overview) — small, focused helpers
  shared across the ecosystem, such as collections, time spans, file sizes,
  and backoff policies.
