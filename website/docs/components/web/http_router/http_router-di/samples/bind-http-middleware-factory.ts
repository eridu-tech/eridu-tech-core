import { bindHttpMiddleware, router } from "./container.js";
import { requestLogToken } from "./middleware.js";

router.use(bindHttpMiddleware(requestLogToken));
