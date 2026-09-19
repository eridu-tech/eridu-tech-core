---
sidebar_position: 3
sidebar_label: Creating adapters
pagination_label: Creating TransactionContext adapters
tags:
    - TransactionContext
    - Creating adapters
keywords:
    - TransactionContext
    - Creating adapters
---

# Creating TransactionContext adapters

## Implementing your custom ITransactionAdapter

In order to create an adapter you need to implement the [`ITransactionAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/TransactionContext.ITransactionAdapter.html) contract.

## Implementing your custom ITransactionContext class

In some cases, you may need to implement a custom [`TransactionContext`](https://eridu-tech.github.io/eridu-tech-core/classes/TransactionContext.TransactionContext.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ITransactionContext`](https://eridu-tech.github.io/eridu-tech-core/types/TransactionContext.ITransactionContext.html) contract.

## Further information

For further information refer to [`eridu-tech/transaction-context`](https://eridu-tech.github.io/eridu-tech-core/modules/TransactionContext.html) API docs.
