---
"eridu-tech": minor
---

Updated `TransactionContextResolver` to initialize and retain a transaction context for each registered adapter. Call `init()` before selecting an adapter or registering after-commit hooks.
