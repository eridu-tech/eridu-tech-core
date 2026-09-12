---
sidebar_position: 4
sidebar_label: Configuring policies
pagination_label: Configuring CircuitBreaker policies
---

# Configuring CircuitBreaker policies

## ConsecutiveBreaker

The `ConsecutiveBreaker` breaks after n requests in a row fail.

```ts file=./samples/consecutive-breaker.ts

```

## CountBreaker

The `CountBreaker` breaks after a proportion of requests in a count based sliding window fail.

```ts file=./samples/count-breaker.ts

```

## SamplingBreaker

The `SamplingBreaker` breaks after a proportion of requests over a time period fail.

```ts file=./samples/sampling-breaker.ts

```

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.
