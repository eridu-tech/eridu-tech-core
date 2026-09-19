---
"eridu-tech": patch
---

Declared the optional runtime integrations as peer dependencies and removed the unused `raw-loader` dev dependency.

- `hono` is now declared as an optional peer dependency. The `http-router` component imports it directly, so the package is now a stated requirement instead of an implicit one. Because it is marked optional in `peerDependenciesMeta`, it is only needed by consumers that use `http-router`.
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` were already marked as optional, but were missing from `peerDependencies`. Both are now declared there, so consumers of the `file-storage` S3 adapter get a proper peer dependency requirement instead of a missing-module error at runtime.
- Relaxed the `kysely` peer dependency range from `^0.29.4` to `^0.29.0`, so every `0.29.x` release is accepted.
- Removed the unused `raw-loader` dev dependency.
