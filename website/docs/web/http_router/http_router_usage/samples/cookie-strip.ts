import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ res }: HttpHandlerArgs): Promise<IHttpRes> => {
    return res.withoutCookies().setBody("All cookies stripped");
};
