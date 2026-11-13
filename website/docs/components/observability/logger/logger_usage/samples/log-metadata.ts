import { log } from "./log-initial-config.js";

// Metadata is attached to every entry logged while the scope runs
log.run(
    () => {
        log.info(["Handling request"]);
    },
    { metadata: { requestId: "req-1" } },
);

// Nested scopes merge their metadata, then restore the outer metadata
log.run(
    () => {
        log.run(
            () => {
                log.info(["Loading profile"]);
            },
            { metadata: { userId: "42" } },
        );
    },
    { metadata: { requestId: "req-1" } },
);

// Merges into the current scope without opening a new one
log.putMetadata({ tenant: "acme" });
log.putMetadata("region", "eu-west-1");
log.info(["Tenant and region are attached to this entry"]);
