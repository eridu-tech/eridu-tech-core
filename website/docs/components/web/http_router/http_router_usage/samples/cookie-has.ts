import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ res }: HttpHandlerArgs): Promise<IHttpRes> => {
    if (res.hasCookies("session")) {
        res.removeCookie("session");
    }
    return res.setBody("Checked");
};
