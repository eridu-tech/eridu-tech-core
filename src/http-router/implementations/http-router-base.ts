/**
 * @module HttpRouter
 */
import { MiddlewareBuilder } from "@/http-router/implementations/middleware-builder.js";
import { withPrefix } from "@/http-router/implementations/with-prefix.js";
import { callInvocable, isInvocable } from "@/utilities/_module.js";

import type { Router } from "hono/router";

import type {
    HttpMiddleware,
    HttpRouteGroup,
    IHttpEndpoint,
    IHttpRouterBase,
} from "@/http-router/contracts/_module.js";
import type { RouterEntry } from "@/http-router/implementations/types.js";

/**
 * @internal
 */
export class HttpRouterBase implements IHttpRouterBase {
    constructor(
        private readonly prefix: string,
        private readonly middlewares: Array<HttpMiddleware>,
        private readonly router: Router<RouterEntry>,
    ) {}

    use(middleware: HttpMiddleware): IHttpRouterBase {
        this.middlewares.push(middleware);
        return this;
    }

    endpoint(endpoint: IHttpEndpoint): IHttpRouterBase {
        const endpoint_ = endpoint;
        const {
            method: methods = [
                "CONNECT",
                "DELETE",
                "GET",
                "HEAD",
                "OPTIONS",
                "PATCH",
                "POST",
                "PUT",
                "TRACE",
            ],
            url,
            middlewares = (builder) => builder,
        } = endpoint_;

        const endpointMiddlewares: Array<HttpMiddleware> = [];
        callInvocable(middlewares, new MiddlewareBuilder(endpointMiddlewares));

        const prefixedUrl = withPrefix(this.prefix, url);

        for (const method of methods) {
            const methodLowerCase = method.toLowerCase();

            for (const middleware of this.middlewares) {
                this.router.add(methodLowerCase, prefixedUrl, {
                    type: "middleware",
                    middleware,
                });
            }

            for (const middleware of endpointMiddlewares) {
                this.router.add(methodLowerCase, prefixedUrl, {
                    type: "middleware",
                    middleware,
                });
            }

            this.router.add(methodLowerCase, prefixedUrl, {
                type: "endpoint",
                endpoint: endpoint_,
            });
        }

        return this;
    }

    group(group: HttpRouteGroup): IHttpRouterBase;
    group(prefix: string, group: HttpRouteGroup): IHttpRouterBase;
    group(
        prefixOrGroup: HttpRouteGroup | string,
        group?: HttpRouteGroup,
    ): IHttpRouterBase {
        if (isInvocable(prefixOrGroup)) {
            callInvocable(
                prefixOrGroup,
                new HttpRouterBase(
                    withPrefix(this.prefix, "/"),
                    this.middlewares,
                    this.router,
                ),
            );
            return this;
        }

        if (group !== undefined && typeof prefixOrGroup === "string") {
            callInvocable(
                group,
                new HttpRouterBase(
                    withPrefix(this.prefix, prefixOrGroup),
                    this.middlewares,
                    this.router,
                ),
            );
            return this;
        }

        throw new TypeError(
            "Invalid arguments: expected a route group function or a prefix string and group function.",
        );
    }
}
