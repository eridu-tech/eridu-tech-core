import { KeyNotFoundFileError } from "eridu-tech/file-storage/contracts";
import { withHttpFileStorageError } from "eridu-tech/file-storage/middlewares";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
});

router.use(withHttpFileStorageError());

router.endpoint({
    url: "/files/1",
    method: ["GET"],
    handler: async () => {
        // A 404 response when the file does not exist
        throw KeyNotFoundFileError.create("avatars/1.png");
    },
});
