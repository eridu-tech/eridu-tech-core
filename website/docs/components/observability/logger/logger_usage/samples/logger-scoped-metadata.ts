import { logger } from "./logger-initial-config.js";

// Values form, restored when the invocation returns
logger.scopedMetadata({ requestId: "req-1" }, () => {
    logger.info(["Handling request"]);
});

// Key-value form
logger.scopedMetadata("userId", "42", () => {
    logger.info(["Loading profile"]);
});

// Merges into the current scope without opening a new one
logger.putMetadata({ tenant: "acme" });
logger.putMetadata("region", "eu-west-1");
logger.info(["Tenant and region are attached to this entry"]);
