import { genericToken } from "eridu-tech/di/contracts";
import { container } from "./container.js";

import type { HttpMiddleware } from "eridu-tech/http-router/contracts";

export const requestLoggerToken = genericToken<HttpMiddleware>("requestLogger");

container.registerValue({
    token: requestLoggerToken,
    value: {
        async invoke({ next, req }) {
            console.log(`${req.method} ${req.url}`);
            return next();
        },
    },
});
