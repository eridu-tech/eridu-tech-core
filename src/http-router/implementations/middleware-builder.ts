/**
 * @module HttpRouter
 */
import type {
    HttpMiddleware,
    IMiddlewareBuilder,
} from "@/http-router/contracts/_module-exports.js";

/**
 * @internal
 */
export class MiddlewareBuilder implements IMiddlewareBuilder {
    constructor(private readonly middlewares: Array<HttpMiddleware>) {}

    use(middleware: HttpMiddleware): IMiddlewareBuilder {
        this.middlewares.push(middleware);
        return this;
    }
}
