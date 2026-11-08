import { logger } from "./logger-initial-config.js";

const user = logger.span("user.load", () => {
    // Entries logged here carry the elapsed time of "user.load"
    logger.info("Loading user");
    return { id: "42" };
});

// Spans can be nested, every open span is attached to the entry
logger.span("request", () => {
    logger.span("db.query", () => {
        logger.info("Running query");
    });
});
