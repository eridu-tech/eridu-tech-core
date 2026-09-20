import { router } from "./http-router-initial-config.js";

// Matches /wild/anything/card
router.endpoint({
    url: "/wild/*/card",
    method: ["GET"],
    handler: async ({ text }) => text("GET /wild/*/card"),
});
