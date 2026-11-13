import { container } from "./container.js";
import { ConsoleLog, Log } from "./log.js";

await container.init();

const log = container.resolveOr(Log, new ConsoleLog());
log.log("Always has a log");
