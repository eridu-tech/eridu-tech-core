---
"eridu-tech": minor
---

Serialization registration is no longer based on runtime class names. `ISerderRegister` was renamed to `ISerdeRegister` and its `registerClass` method was removed, along with the `ISerializable` and `SerializableClass` contracts.

Bundlers and minifiers rename classes, so `registerClass` could assign the same deserialization identifier to unrelated classes and deserialize values into the wrong type. Registration now always requires an explicit name, which is only possible through `registerCustom`.

### Breaking changes

- Renamed `ISerderRegister` to `ISerdeRegister`.
- Removed `ISerderRegister.registerClass`, `ISerializable`, and `SerializableClass`.
- `ICollection` no longer implements `ISerializable`. `FileSize`, `TimeSpan`, `ListCollection`, and `IterableCollection` no longer implement it either; their `serialize()` and static `deserialize()` methods were replaced by a static `serdeTransformer` property that is passed to `registerCustom`.

### Migration

Replace `registerClass` with `registerCustom`, giving the transformer an explicit `name`:

**Before:**

```ts
class User implements ISerializable<ISerializedUser> {
    static deserialize(serializedUser: ISerializedUser): User {
        return new User(serializedUser.name, serializedUser.age);
    }

    constructor(
        public readonly name: string,
        public readonly age: number,
    ) {}

    serialize(): ISerializedUser {
        return { version: "1", name: this.name, age: this.age };
    }
}

serde.registerClass(User);
```

**After:**

```ts
class User {
    static readonly serdeTransformer: ISerdeTransformer<User, ISerializedUser> =
        {
            name: "User",
            isApplicable: (value): value is User => value instanceof User,
            serialize: (user) => ({
                version: "1",
                name: user.name,
                age: user.age,
            }),
            deserialize: (serializedUser) =>
                new User(serializedUser.name, serializedUser.age),
        };

    constructor(
        public readonly name: string,
        public readonly age: number,
    ) {}
}

serde.registerCustom<User, ISerializedUser>(User.serdeTransformer);
```

Built-in types expose the transformer to register:

**Before:**

```ts
serde.registerClass(FileSize);
```

**After:**

```ts
serde.registerCustom(FileSize.serdeTransformer);
```
