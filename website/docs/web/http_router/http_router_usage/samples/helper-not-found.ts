import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ notFound }: HttpHandlerArgs): Promise<IHttpRes> => notFound();
// Status: 404, Content-Type: text/html
