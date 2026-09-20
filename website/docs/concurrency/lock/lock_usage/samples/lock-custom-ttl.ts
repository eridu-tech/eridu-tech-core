import { lockFactory } from "./lock-factory-initial-config.js";
import { TimeSpan } from "eridu-tech/time-span";

const lock = lockFactory.create("shared-resource", {
    // Default TTL is 5min if not overrided
    // If you set it to null it means locks will not expire and most be released manually.
    ttl: TimeSpan.fromSeconds(30),
});
