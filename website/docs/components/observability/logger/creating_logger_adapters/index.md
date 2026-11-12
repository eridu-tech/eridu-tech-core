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

In order to create an adapter you need to implement the [`ILoggerTransport`](https://eridu-tech.github.io/eridu-tech-core/types/Logger.ILoggerTransport.html) contract. It declares a single `log` method that receives one fully built [`LogData`](https://eridu-tech.github.io/eridu-tech-core/types/Logger.LogData.html) record, so your implementation only has to format and output it.

Each entry carries:

| Field      | Type                                | Description                                                           |
| ---------- | ----------------------------------- | --------------------------------------------------------------------- |
| `level`    | `AllLogLevels`                      | `debug`, `verbose`, `info`, `warn`, `error` or `fatal`                |
| `group`    | `string`                            | Group label from the logging method or the enclosing `run` scope      |
| `loggedAt` | `number`                            | Unix timestamp in ms at which the entry was created                   |
| `messages` | `Array<unknown>`                    | Logged values, in the order they were passed to the logger            |
| `metadata` | `Partial<Record<string, unknown>>`  | Metadata from the logging method, `run`, or `putMetadata`             |
| `error`    | `unknown`                           | Error details attached by `warn`, `error`, and `fatal`                |
| `spans`    | `Partial<Record<string, TimeSpan>>` | Elapsed time of each `run` span still open when the entry was created |

Transports may throw. When `log` fails, the `Logger` wraps the error in `UnableToLogError`, preserving the original error as the `cause`.

```ts file=./samples/custom-logger-transport.ts

```

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Logger.html) API docs.
