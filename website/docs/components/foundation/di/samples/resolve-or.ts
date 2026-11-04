import { container } from "./container.js";
import { ConsoleLogger, Logger } from "./logger.js";

await container.init();

const logger = container.resolveOr(Logger, new ConsoleLogger());
logger.log("Always has a logger");
