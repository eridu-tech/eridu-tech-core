---
"eridu-tech": minor
---

Add a secret wrapper that redacts string output and supports serialization.

```ts
import { secret } from "eridu-tech/secret";

const apiKey = secret("example-api-key");

console.log(`Using API key: ${apiKey}`); // Using API key: [redacted]
const rawApiKey = apiKey.get(); // Handle this value carefully.
```
