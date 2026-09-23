---
sidebar_position: 4
sidebar_label: Analog.js
pagination_label: Analog.js
tags:
    - HttpRouter
    - Analog.js
keywords:
    - HttpRouter
    - Analog.js
---

# Analog.js

Analog.js API routes are powered by [h3](https://h3.unjs.io/). Use [`fromWebHandler`](https://v1.h3.dev/guide/event-handler#converting-from-web-handlers) from `h3` to convert winter-tc request handler into h3 request handler.

### 1. Install

```sh
npm install eridu-tech hono
```

### 2. Create the handler

```ts file=./samples/create-handler.ts name=src/server/routes/api/[...].ts

```

**File structure**

```
.
├── src
│   └── server
│       └── routes
│           └── api
│               └── [...].ts
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

**Reference:** [Analog API Routes](https://analogjs.org/docs/features/api/overview)
