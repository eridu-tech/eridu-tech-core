import { LoggerResolver } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { MemoryLoggerTransport } from "eridu-tech/logger/memory-logger-transport";

const memoryTransport = new MemoryLoggerTransport();

export const loggerResolver = new LoggerResolver({
    transports: {
        console: new ConsoleLoggerTransport(),
        memory: memoryTransport,
    },
    // One or more aliases: every listed transport receives each entry
    defaultTransport: ["console", "memory"],
});

loggerResolver.init();

// Writes to both the console and the memory transport
loggerResolver.use().info(["Written to every default transport"]);

// A list is also accepted when transports are selected explicitly
loggerResolver.use(["console", "memory"]).info(["Composed logger"]);
