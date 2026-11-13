---
"eridu-tech": minor
---

Add `MemoryLogTransport`, which stores log entries in memory and exposes them through `entries`, with `clear()` to remove them. Useful in tests to assert on the entries a log produced.
