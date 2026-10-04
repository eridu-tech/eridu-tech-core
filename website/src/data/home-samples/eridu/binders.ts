import { bindHttpFactory } from "eridu-tech/http-router/di"
import { container } from "./container"

export const bindHttp = bindHttpFactory(container)