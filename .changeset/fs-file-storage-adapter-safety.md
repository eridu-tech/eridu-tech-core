---
"eridu-tech": minor
---

`FsFileStorageAdapter` now stores files in a safe, collision-free folder layout.

- Key segments become nested folders (`"a/b"` → `<location>/N/S_<a>/K/S_<b>`), so `"a"` and `"a/b"` can coexist and long keys stay under the file name limit.
- New `codec` setting (base64url by default) encodes each segment, so unsafe characters work and `"../secret"` cannot escape the root folder.
- `copy()` creates the destination folders, and `removeByPrefix("")` deletes the root folder.
- `init()`/`deInit()` are idempotent and no longer swallow filesystem errors.
