import { cacheResolverDiFactory } from "eridu-tech/cache/di"
import { CacheResolver } from "eridu-tech/cache"
import { container } from "./container"

export const cache = cacheResolverDiFactory(container, CacheResolver)