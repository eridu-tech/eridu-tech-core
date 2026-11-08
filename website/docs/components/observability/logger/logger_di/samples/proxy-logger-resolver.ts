import { LoggerResolver } from "eridu-tech/logger";
import { ProxyLoggerResolver } from "eridu-tech/logger/di";
import { container } from "./container.js";
import {
    consoleLoggerTransport,
    noOpLoggerTransport,
} from "./logger-transports.js";

type Transports = "console" | "no-op";

const loggerResolver = new LoggerResolver<Transports>({
    transports: {
        console: consoleLoggerTransport,
        "no-op": noOpLoggerTransport,
    },
    defaultTransport: "console",
});

await loggerResolver.init();

container.registerValue({
    token: LoggerResolver,
    value: loggerResolver,
});

// Create the proxy before container.init()
export const logger = new ProxyLoggerResolver<Transports>({
    container,
    resolverToken: LoggerResolver,
});

await container.init();
