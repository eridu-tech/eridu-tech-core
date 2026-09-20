import { container } from "./container.js";
import { CONFIG } from "./app-config.js";

container.registerValue({
    token: CONFIG,
    value: {
        apiUrl: "https://api.example.com",
        timeout: 5000,
    },
});
