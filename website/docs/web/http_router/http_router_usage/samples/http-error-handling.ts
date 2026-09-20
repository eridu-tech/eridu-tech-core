import { HttpError } from "eridu-tech/http-router/contracts";
import { router } from "./http-router-initial-config.js";

router.endpoint({
    url: "/secure",
    method: ["GET"],
    handler: async () => {
        throw HttpError.create({
            status: "403",
            message: "Forbidden",
            cause: null,
        });
    },
});
