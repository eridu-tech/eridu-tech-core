/**
 * @module HttpRouter
 */

import { HttpRes } from "@/http-router/implementations/http-res.js";
import { validateSync } from "@/utilities/_module.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
    IHttpRes,
    IHttpResHelpers,
} from "@/http-router/contracts/_module.js";

/**
 * Creates the response helpers bound to the response builder of a single
 * request. Every helper replaces the content of that builder and returns it,
 * so headers, status, and cookies set through `res` beforehand are preserved.
 *
 * @internal
 */
export function createHttpResHelpers(res: IHttpRes): IHttpResHelpers {
    return {
        fromWebRes(webRes: Response): IHttpRes {
            for (const [key, value] of webRes.headers) {
                res.setHeader(key, value);
            }

            res.setStatus(webRes.status).setStatusText(webRes.statusText);

            if (webRes.body !== null) {
                res.setBody(webRes.body);
            }

            return res;
        },
        text(content: string): IHttpRes {
            return res.setBody(content).setContentType("text/plain");
        },
        html(content: string): IHttpRes {
            return res.setBody(content).setContentType("text/html");
        },
        json<TData>(
            content: TData,
            schema?: StandardSchemaV1<unknown, TData>,
        ): IHttpRes {
            if (schema !== undefined) {
                content = validateSync(schema, content);
            }
            return res
                .setBody(JSON.stringify(content))
                .setContentType("application/json");
        },
        notFound(): IHttpRes {
            return res
                .setBody("Not found")
                .setContentType("text/html")
                .setStatus(404);
        },
        redirect(url: string): IHttpRes {
            return res
                .setStatus(302)
                .setLocation(url)
                .setContentType("text/plain");
        },
        permanentRedirect(url: string): IHttpRes {
            return res
                .setStatus(301)
                .setLocation(url)
                .setContentType("text/plain");
        },
    };
}

/**
 * @internal
 */
export const httpResHelpers: IHttpResHelpers = {
    fromWebRes(webRes: Response): IHttpRes {
        return createHttpResHelpers(new HttpRes()).fromWebRes(webRes);
    },
    text(content: string): IHttpRes {
        return createHttpResHelpers(new HttpRes()).text(content);
    },
    html(content: string): IHttpRes {
        return createHttpResHelpers(new HttpRes()).html(content);
    },
    json<TData>(
        content: TData,
        schema?: StandardSchemaV1<unknown, TData>,
    ): IHttpRes {
        return createHttpResHelpers(new HttpRes()).json(content, schema);
    },
    notFound(): IHttpRes {
        return createHttpResHelpers(new HttpRes()).notFound();
    },
    redirect(url: string): IHttpRes {
        return createHttpResHelpers(new HttpRes()).redirect(url);
    },
    permanentRedirect(url: string): IHttpRes {
        return createHttpResHelpers(new HttpRes()).permanentRedirect(url);
    },
};
