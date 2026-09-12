# ErrorPolicy type

The `ErrorPolicy` type determines which errors should be handled for example in resilience middlewares like [`retry`](/docs/components/resilience) or [`fallback`](/docs/components/resilience).

## Predicate as ErrorPolicy

A predicate function can be used to dynamically determine if an error should be handled:

```ts file=./samples/predicate.ts

```

## Classes as ErrorPolicy:

You can directly pass an class to match if errors are instance of the class:

```ts file=./samples/class.ts

```

You can also pass multiple error classes:

```ts file=./samples/multiple-classes.ts

```

## Standard Schema as ErrorPolicy

You can use any [standard schema](https://standardschema.dev/) as error policy:

```ts file=./samples/standard-schema.ts

```

## False return values as error

You can treat false return values as errors. This useful when you want to retry functions that return boolean.

```ts file=./samples/treat-false-as-error.ts

```

## Further information

For further information refer to [`eridu-tech/utilities`](https://eridu-tech.github.io/eridu-tech-core/types/Utilities.ErrorPolicy.html) API docs.
