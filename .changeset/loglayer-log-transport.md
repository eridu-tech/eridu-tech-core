---
"eridu-tech": minor
---

`LogLayerLogTransport` now nests logged metadata under an `attributes` field, so user metadata no longer collides with the transport's own `loggedAt` and `spans` metadata.
