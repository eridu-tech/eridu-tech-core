import { secret } from "eridu-tech/secret";

const apiKey = secret("example-api-key");

console.log(`API key: ${apiKey}`); // API key: [redacted]

const rawApiKey = apiKey.get(); // Handle this value carefully.
