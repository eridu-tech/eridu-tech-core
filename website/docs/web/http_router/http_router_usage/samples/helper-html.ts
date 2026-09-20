import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ html }: HttpHandlerArgs): Promise<IHttpRes> => html("<h1>Title</h1>");
// Content-Type: text/html
