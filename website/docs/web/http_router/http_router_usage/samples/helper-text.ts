import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ text }: HttpHandlerArgs): Promise<IHttpRes> => text("Hello World");
// Content-Type: text/plain
