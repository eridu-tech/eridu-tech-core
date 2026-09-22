---
"eridu-tech": patch
---

Made `Container.createDynamicServiceRegister` private.

- The method is only used internally by `Container` and is not part of the `IContainer` contract, so this only removes it from the accidental public surface of the class.
