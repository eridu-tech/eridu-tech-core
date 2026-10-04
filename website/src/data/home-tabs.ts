import routingSample from "./home-samples/1-routing.ts?raw";
import controllerSample from "./home-samples/2-controller.ts?raw";
import serviceSample from "./home-samples/3-service.ts?raw";
import aopSample from "./home-samples/4-aop.ts?raw";
import diSample from "./home-samples/5-di.ts?raw";

// ─── Landing page: component code tabs ──────────────────────────
// The snippets live as real files under `home-samples/` and are imported
// verbatim with webpack's `?raw`, so each example stays a valid, greppable
// sample that is rendered exactly as written.
export const COMPONENT_CODE_TABS = [
    {
        label: "Routing",
        description:
            "Define every endpoint in one readable chain, resolving controllers from the container with bindHttp.",
        code: routingSample.trim(),
    },
    {
        label: "Controllers",
        description:
            "Controllers own the HTTP boundary: validate the request with a schema, delegate to the service, and shape the response.",
        code: controllerSample.trim(),
    },
    {
        label: "Services",
        description:
            "Business logic and nothing else. Queries run through the transaction-scoped client, so a service joins whatever transaction the caller opened without the client ever being passed around.",
        code: serviceSample.trim(),
    },
    {
        label: "AOP",
        description:
            "AOP (Aspect Oriented Programming) Cross-cutting concerns are layered on as middleware instead of sprinkled through your code. This plugin caches reads and invalidates them on writes by enhancing the service's methods, so the service itself stays untouched.",
        code: aopSample.trim(),
    },
    {
        label: "DI",
        description:
            "UserService is registered as singletons with the cache plugin applied at construction, so every consumer resolves a fully wired, cache-aware instance.",
        code: diSample.trim(),
    },
];
