import { TimeSpan } from "eridu-tech/time-span";

import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

async ({ res }: HttpHandlerArgs): Promise<IHttpRes> => {
    return res
        .putCookie("session", "abc123", {
            httpOnly: true,
            secure: true,
            maxAge: TimeSpan.fromHours(1),
            path: "/",
            sameSite: "Lax",
        })
        .setBody("Cookie set");
};
