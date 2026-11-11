import { logger } from "./logger-initial-config.js";

// Metadata is attached to every entry logged while the scope runs
logger.run(
    () => {
        logger.info(["Handling request"]);
    },
    { metadata: { requestId: "req-1" } },
);

// Nested scopes merge their metadata, then restore the outer metadata
logger.run(
    () => {
        logger.run(
            () => {
                logger.info(["Loading profile"]);
            },
            { metadata: { userId: "42" } },
        );
    },
    { metadata: { requestId: "req-1" } },
);

// Merges into the current scope without opening a new one
logger.putMetadata({ tenant: "acme" });
logger.putMetadata("region", "eu-west-1");
logger.info(["Tenant and region are attached to this entry"]);
