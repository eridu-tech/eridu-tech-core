---
"eridu-tech": minor
---

Serde is now synchronous.

`ISerializer.serialize()` and `IDeserializer.deserialize()` return their results directly instead of returning a `Promise`, and `ISerde`/`IFlexibleSerde` inherit the synchronous signatures:

```ts
const serialized = serde.serialize(order);
const restored = serde.deserialize<Order>(serialized);
```

`ISerdeTransformer` hooks are synchronous too, so custom transformers no longer need to be `async`:

```ts
type SerializedUser = SerializedValueBase & {
    name: string;
    age: number;
};

class UserTransformer implements ISerdeTransformer<User, SerializedUser> {
    name = "User";

    isApplicable(value: unknown): boolean {
        return value instanceof User;
    }

    serialize(deserializedValue: User): SerializedUser {
        return {
            version: "1",
            name: deserializedValue.name,
            age: deserializedValue.age,
        };
    }

    deserialize(serializedValue: SerializedUser): User {
        return new User(serializedValue.name, serializedValue.age);
    }
}
```

- `ISerdeTransformer.isApplicable()`, `serialize()` and `deserialize()` no longer accept or return `Promisable` values.
- `SuperJsonSerde` now uses the synchronous `superjson` package instead of the async-capable `@eridu-tech/superjson` fork, and `NoOpSerde` returns values directly.
- Serialization failures throw `UnableToSerializeSerdeError`/`UnableToDeserializeSerdeError` immediately instead of rejecting a promise.
- The built-in serde transformers exposed by the lock, shared-lock, semaphore, rate-limiter, circuit-breaker and file-storage components, along with the `internalSerializationId()` method of their DI proxies, are now synchronous as a consequence.

### Breaking changes

- `ISerializer.serialize()` and `IDeserializer.deserialize()` no longer return a `Promise`; awaiting their results still works, but chaining `.then()`/`.catch()` does not.
- `ISerdeTransformer.isApplicable()`, `serialize()` and `deserialize()` no longer return a `Promise`, so `async` transformers no longer type-check as `ISerdeTransformer` implementations. Perform asynchronous work before calling `serialize`/`deserialize`.
- `internalSerializationId()` on the DI proxies for lock, shared-lock, semaphore, rate-limiter, circuit-breaker and file-storage returns `string` instead of `Promise<string>`.
