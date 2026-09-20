import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ redirect }: HttpHandlerArgs): Promise<IHttpRes> =>
    redirect("/new-location");
// Status: 302, Location: /new-location
