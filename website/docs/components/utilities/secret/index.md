---
sidebar_position: 9
tags:
    - Utilities
keywords:
    - Utilities
    - Secret
---

# Secret

The `eridu-tech/secret` component wraps sensitive values in an `ISecret`. Its
string representation is always `"[redacted]"`, while `get()` provides
explicit access to the wrapped value.

## Wrapping a value

```ts file=./samples/wrapping-secret.ts

```

:::warning
Redaction applies to string conversion only. `get()` returns the original
value, so handle it carefully. A secret is not encryption or an access-control
boundary.
:::

## Serialization

Register `SecretSerdeTransformer` with your serde instance before serializing
secrets:

```ts file=./samples/serde-serialization.ts

```

The transformer preserves the secret wrapper when deserializing. Its serialized
form contains the original value, so serialized output must also be treated as
sensitive; the transformer does not encrypt it.

## `ISecret` contract

`ISecret<TValue>` exposes two methods:

- `toString()` returns `"[redacted]"`.
- `get()` returns the wrapped value of type `TValue`.

## Further information

For further information, refer to
[`eridu-tech/secret`](https://eridu-tech.github.io/eridu-tech-core/modules/Secret.html)
API docs.
