import { logger } from "./logger-initial-config.js";

const user = logger.run(
    () => {
        // Entries logged here carry the elapsed time of "user.load"
        logger.info(["Loading user"]);
        return { id: "42" };
    },
    { span: "user.load" },
);

logger.info(["Loaded user", user.id]);

// Scopes can be nested, every open span is attached to the entry
logger.run(
    () => {
        logger.run(
            () => {
                logger.info(["Running query"]);
            },
            { group: "db", span: "db.query" },
        );
    },
    { span: "request" },
);
