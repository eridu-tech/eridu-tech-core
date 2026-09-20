import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ res }: HttpHandlerArgs): Promise<IHttpRes> => {
    return res.removeCookie("session").setBody("Cookie removed");
};
