import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ permanentRedirect }: HttpHandlerArgs): Promise<IHttpRes> =>
    permanentRedirect("/new-permanent");
// Status: 301, Location: /new-permanent
