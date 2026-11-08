---
sidebar_position: 4
sidebar_label: Creating adapters
pagination_label: Creating Logger adapters
tags:
    - Logger
    - Creating adapters
    - Transports
keywords:
    - Logger
    - Creating adapters
    - Transports
    - ILoggerTransport
    - LogData
---

# Creating Logger adapters

## Implementing your custom ILoggerTransport

In order to create an adapter you need to implement the [`ILoggerTransport`](https://eridu-tech.github.io/eridu-tech-core/types/Observability.ILoggerTransport.html) contract. It declares a single `log` method that receives one fully built [`LogData`](https://eridu-tech.github.io/eridu-tech-core/types/Observability.LogData.html) record, so your implementation only has to format and output it.

Each entry carries:

| Field      | Type                                | Description                                                     |
| ---------- | ----------------------------------- | --------------------------------------------------------------- |
| `level`    | `AllLogLevels`                      | `debug`, `verbose`, `info`, `warn`, `error` or `fatal`          |
| `loggedAt` | `number`                            | Unix timestamp in ms at which the entry was created             |
| `messages` | `Array<unknown>`                    | Logged values, in the order they were passed to the logger      |
| `metadata` | `Partial<Record<string, unknown>>`  | Metadata attached by `scopedMetadata` and `putMetadata`         |
| `spans`    | `Partial<Record<string, TimeSpan>>` | Elapsed time of each span still open when the entry was created |

```ts file=./samples/custom-logger-transport.ts

```

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Observability.html) API docs.
