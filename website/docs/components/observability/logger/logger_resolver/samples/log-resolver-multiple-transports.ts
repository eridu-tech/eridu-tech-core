import { LogResolver } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { MemoryLogTransport } from "eridu-tech/log/memory-log-transport";

const memoryTransport = new MemoryLogTransport();

export const logResolver = new LogResolver({
    transports: {
        console: new ConsoleLogTransport(),
        memory: memoryTransport,
    },
    // One or more aliases: every listed transport receives each entry
    defaultTransport: ["console", "memory"],
});

logResolver.init();

// Writes to both the console and the memory transport
logResolver.use().info(["Written to every default transport"]);

// A list is also accepted when transports are selected explicitly
logResolver.use(["console", "memory"]).info(["Composed log"]);
