---
sidebar_position: 3
sidebar_label: Nuxt
pagination_label: Nuxt
tags:
    - HttpRouter
    - Nuxt
keywords:
    - HttpRouter
    - Nuxt
---

# Nuxt

Nuxt API routes are powered by [h3](https://h3.unjs.io/). Use [`fromWebHandler`](https://v1.h3.dev/guide/event-handler#converting-from-web-handlers) from `h3` to convert winter-tc request handler into h3 request handler.

### 1. Install

```sh
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./samples/create-handler.ts name=server/api/[...].ts

```

**File structure**

```
.
├── server
│   └── api
│       └── [...].ts
├── package.json
```

### 3. Develop

```sh
npm run dev
```

### 4. Build

```sh
npm run build
```

**Reference:** [Nuxt Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
