import { container } from "./container.js";
import { Log } from "./log.js";

container.registerValue({
    token: Log,
    value: new Log(),
});

await container.init();

if (container.has(Log)) {
    console.log("Log is resolvable");
}
