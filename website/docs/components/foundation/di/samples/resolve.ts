import { container } from "./container.js";
import { Log } from "./log.js";

container.registerValue({
    token: Log,
    value: new Log(),
});

await container.init();

const log = container.resolve(Log);
if (log) {
    log.log("Log is available");
}
