/**
 * @module HttpRouter
 */
import { MiddlewareBuilder } from "@/http-router/implementations/middleware-builder.js";
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

    private withPrefix(subPath: string): string {
        const segments = [this.prefix, subPath]
            .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
            .filter((segment) => segment !== "");

        return `/${segments.join("/")}`;
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

        const prefixedUrl = this.withPrefix(url);

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
                    this.withPrefix("/"),
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
                    this.withPrefix(prefixOrGroup),
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
