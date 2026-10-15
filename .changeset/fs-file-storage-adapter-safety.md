---
"eridu-tech": minor
---

- `FsFileStorageAdapter` no longer stores all files flat in one folder; it stores files in nested directories based on their keys.
- `update()` and `updateStream()` truncate existing files before writing, preventing stale trailing content when replacing a file with shorter content.
