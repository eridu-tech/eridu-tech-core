import { z } from "zod";
import type {
    HttpHandlerArgs,
    IHttpRes,
} from "eridu-tech/http-router/contracts";

const responseSchema = z.object({ name: z.string() });

async ({ json }: HttpHandlerArgs): Promise<IHttpRes> =>
    json({ name: "John" }, responseSchema);
