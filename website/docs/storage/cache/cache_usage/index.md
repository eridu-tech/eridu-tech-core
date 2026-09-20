---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Cache usage
tags:
    - Cache
    - Usage
    - Schema
    - Validation
keywords:
    - Cache
    - Usage
    - Schema
    - Validation
---

# Cache usage

The `eridu-tech/cache` component provides a way for storing key-value pairs with expiration independent of data storage

## Initial configuration

To begin using the `Cache` class, you'll need to create and configure an instance:

```ts file=./samples/cache-initial-config.ts

```

:::info
Here is a complete list of settings for the [`Cache`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.CacheSettingsBase.html) class.
:::

## Cache basics

### Adding keys

You can add a key with a optional TTL to overide the default:

```ts file=./samples/cache-add.ts

```

The method returns true if the key does not exists.

### Retrieving keys

You can retrieve the key:

```ts file=./samples/cache-get.ts

```

### Checking key existence

You can check if the key exists:

```ts file=./samples/cache-exists.ts

```

You can check if the key is missing:

```ts file=./samples/cache-missing.ts

```

### Updating keys

You can update a key and true will be returned if the key exists and was updated:

```ts file=./samples/cache-update.ts

```

You can increment the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown:

```ts file=./samples/cache-increment.ts

```

You can decrement the a key and true will be returned if the key exists and was updated. If the key is not a number an error will be thrown,:

```ts file=./samples/cache-decrement.ts

```

You can perform an upsert that replaces the ttl when updated. True will be returned if the key was updated otherwise false is returned:

```ts file=./samples/cache-put.ts

```

### Removing keys

You can remove a key and true will be returned if the key was found and removed:

```ts file=./samples/cache-remove.ts

```

You can remove multiple keys and true will be returned if one of the keys exists and where removed:

```ts file=./samples/cache-remove-many.ts

```

You can clear all the keys of the given namespace:

```ts file=./samples/cache-clear.ts

```

## Patterns

### Compile time type safety

You can enforce compile time type safety by setting the cache value type:

```ts file=./samples/compile-time-type-safety.ts

```

If you have multiple types you can use algeberical enums:

```ts file=./samples/cache-union-types.ts

```

Alternatively you can use different `Cache` classes with different namespaces:

```ts file=./samples/cache-multiple-namespaces.ts

```

### Runtime type safety

You can validate cache values against a standard-schema-compliant schema by providing the `schema` setting. This works with any library that implements the `StandardSchemaV1` specification, such as Zod, ArkType and Valibot.

When a schema is provided, values are validated:

- **On write** — before a value is stored, for the `add`, `put`, `update` and `getOrAdd` methods.
- **On read** — when `shouldValidateOutput` is `true` (the default), values returned by `get`, `getAndRemove` and `getOrAdd` are validated on retrieval. This catches malformed data already present in the cache at read time, instead of silently returning it.

If validation fails, a `ValidationError` is thrown.

```ts file=./samples/cache-runtime-validation.ts

```

#### Disabling output validation

If you only want to validate values on write and skip validation when reading, set `shouldValidateOutput` to `false`:

```ts file=./samples/cache-disable-output-validation.ts

```

### Additional methods

You can retrieve the key and if it does not exist an error will be thrown:

```ts file=./samples/cache-get-or-fail.ts

```

You can retrieve the key and if it does not exist you can return a default value:

```ts file=./samples/cache-get-or.ts

```

You can retrieve the key and if it does not exist you can insert a default value that will aslo be returned:

```ts file=./samples/cache-get-or-add.ts

```

You can retrieve the key and afterwards remove it:

```ts file=./samples/cache-get-and-remove.ts

```

You can add key and if it does exist an error will be thrown:

```ts file=./samples/cache-add-or-fail.ts

```

You can update the key and if it does not exist an error will be thrown:

```ts file=./samples/cache-update-or-fail.ts

```

You can increment the key and if it does not exist an error will be thrown:

```ts file=./samples/cache-increment-or-fail.ts

```

You can decrement the key and if it does not exist an error will be thrown:

```ts file=./samples/cache-decrement-or-fail.ts

```

You can remove the key and if it does not exist an error will be thrown:

```ts file=./samples/cache-remove-or-fail.ts

```

### Separating cache reading from manipulation

The library includes 2 additional contracts:

- [`IReadableCache`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.IReadableCache.html) - Allows only for reading cache.

- [`ICache`](https://eridu-tech.github.io/eridu-tech-core/types/Cache.ICache.html) - Allows for both reading and manipulating the cache.

This separation makes it easy to visually distinguish the two contracts, making it immediately obvious that they serve different purposes.

```ts file=./samples/cache-read-write-contracts.ts

```

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.
