import { bindHttpMiddleware, router } from "./container.js";
import { requestLoggerToken } from "./middleware.js";

router.use(bindHttpMiddleware(requestLoggerToken));
