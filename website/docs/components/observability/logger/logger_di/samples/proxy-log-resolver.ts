import { LogResolver } from "eridu-tech/log";
import { ProxyLogResolver } from "eridu-tech/log/di";
import { container } from "./container.js";
import {
    consoleLogTransport,
    noOpLogTransport,
} from "./log-transports.js";

type Transports = "console" | "no-op";

const logResolver = new LogResolver<Transports>({
    transports: {
        console: consoleLogTransport,
        "no-op": noOpLogTransport,
    },
    defaultTransport: "console",
});

await logResolver.init();

container.registerValue({
    token: LogResolver,
    value: logResolver,
});

// Create the proxy before container.init()
export const log = new ProxyLogResolver<Transports>({
    container,
    resolverToken: LogResolver,
});

await container.init();
