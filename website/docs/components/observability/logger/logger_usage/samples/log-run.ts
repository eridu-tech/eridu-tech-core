import { log } from "./log-initial-config.js";

const user = log.run(
    () => {
        // Entries logged here carry the elapsed time of "user.load"
        log.info(["Loading user"]);
        return { id: "42" };
    },
    { span: "user.load" },
);

log.info(["Loaded user", user.id]);

// Scopes can be nested, every open span is attached to the entry
log.run(
    () => {
        log.run(
            () => {
                log.info(["Running query"]);
            },
            { group: "db", span: "db.query" },
        );
    },
    { span: "request" },
);
