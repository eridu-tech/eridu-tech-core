import { router } from "./http-router-initial-config.js";

// Matches /static/js/app.js, /static/css/style.css, etc.
router.endpoint({
    url: "/static/*",
    method: ["GET"],
    handler: async ({ text }) => text("Static file"),
});
