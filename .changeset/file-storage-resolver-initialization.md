---
"eridu-tech": minor
---

`FileStorageResolver` initializes and retains its adapter-specific storage instances during `init()`; call it before selecting a storage adapter.

File serialization now uses the async-capable serde contract and defaults to `NoOpSerde`. Supply `SuperJsonSerde` or another serde explicitly when file objects must be transformed across a serialization boundary.

The file-storage DI entrypoint exposes `ProxyFileStorageResolver` as a directly constructible class that resolves the registered resolver lazily from the container. Construct the proxy directly instead of going through a separate DI factory helper.

### Breaking changes

- Replace `fileStorageResolverDiFactory(container, token)` with `new ProxyFileStorageResolver({ container, resolverToken })`.
- Import `ProxyFileStorageResolver` from `eridu-tech/file-storage/di`; the proxy is now a public class constructed with one settings object.
