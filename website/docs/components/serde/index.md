---
tags:
    - Utilities
keywords:
    - Utilities
---

# Serde

The `eridu-tech/serde` component provides seamless way to serialize/deserialize data and adding custom serialization/deserialization logic for custom data types.

## Initial configuration

```ts file=./samples/serde_initial_config.ts

```

## Serde basics

### Serializing and deserializing values

Here is an example of serializing and deserializing a value.

```ts file=./samples/serialize.ts

```

### Custom serialization and deserialization logic

The `registerCustom` method offers control over serialization and deserialization behavior.

```ts file=./samples/register_custom.ts

```

:::info
Note the `ISerdeTranformer` object can be dynamically created.
:::

## Patterns

### Usage with other components

When using `Serde` class instance there is no need to call `serialize` and `deserialize` manually. Because components like `Cache` handle it automatically through their adapter.

```ts file=./samples/with_cache.ts

```

:::info
Note you should use one `Serde` class instance accross all components and register all serializable objects before component usage.
:::

## Separating serialization, deserialization and registering custom serialization/deserialization logic

The library includes 4 additional contracts:

- `ISerializer` - Allows only for serialization.

- `IDeserializer` - Allows only for deserialization.

- `ISerde` - Allows for both serialization and deserialization.

- `ISerderRegister` - Allows only for registering custom serialization/deserialization logic.

- `IFlexibleSerde` – Allows for both serialization, deserialization and for registering custom serialization/deserialization and deserialization logic.

This separation makes it easy to visually distinguish the 4 contracts, making it immediately obvious that they serve different purposes.

## Further information

For further information refer to [`eridu-tech/serde`](https://eridu-tech.github.io/eridu-tech-core/modules/Serde.html) API docs.
