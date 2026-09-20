import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ json }: HttpHandlerArgs): Promise<IHttpRes> =>
    json({ message: "success" });
// Content-Type: application/json
