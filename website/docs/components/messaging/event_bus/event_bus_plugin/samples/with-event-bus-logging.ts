import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { withEventBusLogging } from "eridu-tech/event-bus/plugins";
import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { withPlugin } from "eridu-tech/middleware";

const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
});

const adapter = new MemoryEventBusAdapter();

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withEventBusLogging(logger));
