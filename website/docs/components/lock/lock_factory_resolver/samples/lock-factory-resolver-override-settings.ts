import { lockFactoryResolver } from "./lock-factory-resolver-initial-config.js";
import { TimeSpan } from "eridu-tech/time-span";

await lockFactoryResolver
    .setDefaultTtl(TimeSpan.fromMinutes(5))
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
