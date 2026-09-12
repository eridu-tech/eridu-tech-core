import { router } from "./http-router-initial-config.js";

router.endpoint({
    url: "/posts/:filename{.+\\.png}",
    method: ["GET"],
    handler: async ({ req, json }) => {
        const { filename } = req.params();
        return json({ filename });
    },
});
