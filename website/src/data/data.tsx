import type {
    FeatureItemProps,
    ComponentItemProps,
    WhoIsThisForItem,
    CodeFile,
    ComparisonItem,
} from "./types.js";
import {
    Box,
    ShieldCheck,
    ShieldAlert,
    Server,
    Clock,
    Layers,
    Bell,
    Users,
    Lock,
    Lightbulb,
    Plug,
    Search,
    Copy,
    Database,
    Send,
    Inbox,
    RefreshCw,
    Zap,
    Globe,
    HardDrive,
    Radio,
    CircuitBoard,
    ArrowLeftRight,
    List,
    Share2,
    GitBranch,
    Gauge,
    Terminal,
    MessageSquare,
    Reply,
    Leaf,
    Image,
    Activity,
    SquareFunction,
    Wrench,
    BatteryFull,
} from "lucide-react";

export const INSTALL_CMD = "npm install eridu-tech";

// ─── External Links ────────────────────────────────────────────
// Single source of truth for external URLs referenced across the site.
export const GITHUB_REPO_URL = "https://github.com/daiso-tech/daiso-core";

// ─── Landing Page Copy ─────────────────────────────────────────
export const HERO_TITLE = "The embeddable and composable TypeScript framework";

export const HERO_SUBTITLE =
    "Think shadcn, but for your backend. Embed Eridu into Next.js, TanStack Start, Nuxt, or any fullstack framework and compose only the backend capabilities your application needs.";

export const CODE_TABS_TITLE = "Everything fits together";

export const CODE_TABS_SUBTITLE = (
    <>
        See how routing, controllers, services, dependency injection, and
        middleware compose into one application model
    </>
);

// ─── Components Record ──────────────────────────────────────────
// Single source of truth for every component, keyed by name.
// Each curated list below references entries from this record.

const EXISTING_FOUNDATION_RECORD = {
    // ─── Existing: Foundation ──────────────────────────────────
    MIDDLEWARE_AND_AOP: {
        name: "Middleware and AOP",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Middleware and AOP</>,
        link: "/docs/foundation/middleware",
        maturity: 90,
        description: (
            <>
                Composable middleware pipeline with before/after hooks and error
                handling, the foundation for every component&apos;s plugin
                system.
            </>
        ),
    } satisfies ComponentItemProps,
    DI_CONTAINER: {
        name: "DI Container",
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: <>DI Container</>,
        link: "/docs/foundation/di",
        maturity: 90,
        description: (
            <>
                A lightweight, type-safe dependency injection container for
                wiring application components without tight coupling.
            </>
        ),
    } satisfies ComponentItemProps,
    SERDE: {
        name: "Serde",
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: <>Serde</>,
        link: "/docs/foundation/serde",
        maturity: 80,
        description: (
            <>
                Serialize and deserialize data with a built-in SuperJSON adapter
                and custom serializers, the backbone for all data interchange
                across the ecosystem.
            </>
        ),
    } satisfies ComponentItemProps,
    CODEC: {
        name: "Codec",
        icon: <ArrowLeftRight size="1.5rem" strokeWidth={1.5} />,
        title: <>Codec</>,
        link: "/docs/foundation/codec",
        maturity: 80,
        description: (
            <>
                Encode and decode data with a unified, type-safe interface that
                includes a built-in Base64 codec and lets you build custom
                codecs for any protocol.
            </>
        ),
    } satisfies ComponentItemProps,
    EXECUTION_CONTEXT: {
        name: "Execution Context",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Execution Context</>,
        link: "/docs/foundation/execution_context",
        maturity: 90,
        description: (
            <>
                Type-safe, composable context propagation for request IDs, user
                info, and tracing metadata across async boundaries, without
                manual context passing.
            </>
        ),
    } satisfies ComponentItemProps,
    TYPED_CONFIG_ACCESS: {
        name: "Typed Config Access",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>Typed Config Access</>,
        link: "/docs/foundation/config_accessor",
        maturity: 90,
        description: (
            <>
                Standardized type-safe access to domain configuration variables,
                with optional schema validation and full TypeScript inference.
            </>
        ),
    } satisfies ComponentItemProps,
    TYPED_ENV_ACCESS: {
        name: "Typed Env Access",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>Typed Env Access</>,
        link: "/docs/foundation/env_accessor",
        maturity: 90,
        description: (
            <>
                Type-safe environment variable access from multiple sync/async
                sources with parsing, defaults, and validation.
            </>
        ),
    } satisfies ComponentItemProps,
    TRANSACTION_CONTEXT: {
        name: "Transaction Context",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Transaction Context</>,
        link: "/docs/foundation/transaction_context/transaction_context_usage",
        maturity: 90,
        description: (
            <>
                Coordinate database transactions across components with support
                for the after-commit pattern, joining existing transactions, and
                pluggable adapters (Kysely, MongoDB).
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_STORAGE_RECORD = {
    // ─── Existing: Storage ────────────────────────────────────
    CACHE: {
        name: "Cache",
        icon: <HardDrive size="1.5rem" strokeWidth={1.5} />,
        title: <>Cache</>,
        link: "/docs/storage/cache/cache_usage",
        maturity: 90,
        description: (
            <>
                Caching with pluggable stores (in-memory, Redis, etc.), TTL
                policies, and stampede protection.
            </>
        ),
    } satisfies ComponentItemProps,
    FILE_STORAGE: {
        name: "File Storage",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>File Storage</>,
        link: "/docs/storage/file_storage/file_storage_usage",
        maturity: 90,
        description: (
            <>
                Abstract file storage with adapters for local disk,
                S3-compatible, and other backends, upload, stream, and serve
                with one API.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_RELIABILITY_RECORD = {
    // ─── Existing: Reliability ────────────────────────────────
    CIRCUIT_BREAKER: {
        name: "Circuit Breaker",
        icon: <CircuitBoard size="1.5rem" strokeWidth={1.5} />,
        title: <>Circuit Breaker</>,
        link: "/docs/reliability/circuit_breaker/circuit_breaker_usage",
        maturity: 90,
        description: (
            <>
                Prevent cascading failures with configurable thresholds,
                half-open recovery, and custom fallback strategies.
            </>
        ),
    } satisfies ComponentItemProps,
    RATE_LIMITER: {
        name: "Rate Limiter",
        icon: <Gauge size="1.5rem" strokeWidth={1.5} />,
        title: <>Rate Limiter</>,
        link: "/docs/reliability/rate-limiter/rate_limiter_usage",
        maturity: 90,
        description: (
            <>
                Throttle request rates with configurable limits, sliding
                windows, and pluggable backends, protect your services from
                overload.
            </>
        ),
    } satisfies ComponentItemProps,
    RESILIENCE: {
        name: "Resilience",
        icon: <ShieldCheck size="1.5rem" strokeWidth={1.5} />,
        title: <>Resilience</>,
        link: "/docs/reliability/resilience",
        maturity: 90,
        description: (
            <>
                Timeout, fallback, retry, with configurable policies and
                backoffs.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_CONCURRENCY_RECORD = {
    // ─── Existing: Concurrency ────────────────────────────────
    LOCK: {
        name: "Lock",
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: <>Lock</>,
        link: "/docs/concurrency/lock/lock_usage",
        maturity: 90,
        description: (
            <>
                Distributed lock primitives with lease management, blocking and
                non-blocking acquisition, and automatic release.
            </>
        ),
    } satisfies ComponentItemProps,
    SHARED_LOCK: {
        name: "Shared Lock",
        icon: <Share2 size="1.5rem" strokeWidth={1.5} />,
        title: <>Shared Lock</>,
        link: "/docs/concurrency/shared_lock/shared_lock_usage",
        maturity: 90,
        description: (
            <>
                Read-write distributed locks for coordinating concurrent access
                with shared and exclusive modes.
            </>
        ),
    } satisfies ComponentItemProps,
    SEMAPHORE: {
        name: "Semaphore",
        icon: <List size="1.5rem" strokeWidth={1.5} />,
        title: <>Semaphore</>,
        link: "/docs/concurrency/semaphore/semaphore_usage",
        maturity: 90,
        description: (
            <>
                Rate-limit concurrent access to shared resources with dynamic
                permit allocation.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_MESSAGING_RECORD = {
    // ─── Existing: Messaging ──────────────────────────────────
    EVENT_BUS: {
        name: "Event Bus",
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: <>Event Bus</>,
        link: "/docs/messaging/event_bus/event_bus_usage",
        maturity: 90,
        description: (
            <>
                Pub/sub event bus for dispatching and listening to events with
                pluggable transport backends, independent of underlying
                technology.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_WEB_RECORD = {
    // ─── Existing: Web ───────────────────────────────────────
    HTTP_ROUTER: {
        name: "HTTP Router",
        icon: <GitBranch size="1.5rem" strokeWidth={1.5} />,
        title: <>HTTP Router</>,
        link: "/docs/web/http_router/http_router_usage",
        maturity: 90,
        description: (
            <>
                Framework-agnostic HTTP router built on the Hono router engine,
                implements the Winter TC fetch standard with middleware chains
                and typed path parameters.
            </>
        ),
    } satisfies ComponentItemProps,
};

const EXISTING_UTILITIES_RECORD = {
    // ─── Existing: Utilities ─────────────────────────────────
    COLLECTION: {
        name: "Collection",
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: <>Collection</>,
        link: "/docs/utilities/collection",
        maturity: 90,
        description: (
            <>
                Type-safe collection utilities with powerful query, transform,
                and pagination primitives.
            </>
        ),
    } satisfies ComponentItemProps,
    TIME_SPAN: {
        name: "TimeSpan",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>TimeSpan</>,
        link: "/docs/utilities/time_span",
        maturity: 90,
        description: (
            <>
                Define, manipulate, and compare durations with a typed,
                immutable API, integrates easily with time libraries like Luxon
                and Dayjs.
            </>
        ),
    } satisfies ComponentItemProps,
    FILE_SIZE: {
        name: "FileSize",
        icon: <HardDrive size="1.5rem" strokeWidth={1.5} />,
        title: <>FileSize</>,
        link: "/docs/utilities/file_size",
        maturity: 90,
        description: (
            <>
                Define, manipulate, and compare file sizes with a typed API,
                from bytes to gigabytes, with easy unit conversion.
            </>
        ),
    } satisfies ComponentItemProps,
    BACKOFF_POLICIES: {
        name: "Backoff Policies",
        icon: <RefreshCw size="1.5rem" strokeWidth={1.5} />,
        title: <>Backoff Policies</>,
        link: "/docs/utilities/backoff_policies",
        maturity: 90,
        description: (
            <>
                Predefined retry backoff policies, constant and exponential,
                with configurable delay and jitter.
            </>
        ),
    } satisfies ComponentItemProps,
    ERROR_POLICY_TYPE: {
        name: "ErrorPolicy Type",
        icon: <ShieldAlert size="1.5rem" strokeWidth={1.5} />,
        title: <>ErrorPolicy Type</>,
        link: "/docs/utilities/error_policy_type",
        maturity: 90,
        description: (
            <>
                Decide which errors are handled by resilience middlewares like
                retry and fallback, using a predicate function or one or more
                error classes.
            </>
        ),
    } satisfies ComponentItemProps,
    INVOCABLE: {
        name: "Invocable",
        icon: <SquareFunction size="1.5rem" strokeWidth={1.5} />,
        title: <>Invocable</>,
        link: "/docs/utilities/invocable",
        maturity: 90,
        description: (
            <>
                A callable entity, either a plain function or an object exposing
                an invoke method, so functions and class-based services flow
                through one shared contract.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_FOUNDATION_RUNTIME_RECORD = {
    // ─── Upcoming: Foundation & Runtime ──────────────────────
    CLI_COMMAND: {
        name: "CLI Command",
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: <>CLI Command</>,
        description: (
            <>
                A unified API for defining and executing CLI commands with a
                transport adapter architecture. Run commands locally via child
                processes, remotely over SSH or HTTP, inside Docker containers,
                or through custom transports, all from the same command
                definition.
            </>
        ),
    } satisfies ComponentItemProps,
    STRUCTURED_CONCURRENCY: {
        name: "Structured concurrency",
        icon: <RefreshCw size="1.5rem" strokeWidth={1.5} />,
        title: <>Structured concurrency</>,
        description: (
            <>
                Run async tasks in structured scopes where child tasks are tied
                to their parent&apos;s lifetime, with automatic cancellation,
                error propagation, and resource cleanup.
            </>
        ),
    } satisfies ComponentItemProps,
    PROMISE_QUEUE: {
        name: "Promise Queue",
        icon: <Layers size="1.5rem" strokeWidth={1.5} />,
        title: <>Promise Queue</>,
        description: (
            <>
                A configurable promise queue to control the number of
                concurrently executing promises and prevent resource exhaustion.
            </>
        ),
    } satisfies ComponentItemProps,
    LOGGING_OBSERVABILITY: {
        name: "Logging & Observability",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>Logging & Observability</>,
        description: (
            <>
                Support for observability, logging, metrics, and tracing, with a
                pluggable adapter system. Pre-built adapters for{" "}
                <a href="https://opentelemetry.io/">OpenTelemetry</a> and a
                local adapter that saves logs, traces, and metrics to disk.
            </>
        ),
    } satisfies ComponentItemProps,
    INTROSPECTION: {
        name: "Introspection",
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: <>Introspection</>,
        description: (
            <>
                Inspect the actual runtime state of any component through
                pre-built CLI commands, view registered handlers, active jobs,
                queue depth, lock holders, and more without digging into logs or
                metrics.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_RELIABILITY_MESSAGING_RECORD = {
    // ─── Upcoming: Reliability & Messaging ───────────────────
    JOB_SCHEDULER: {
        name: "Job Scheduler",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>Job Scheduler</>,
        description: (
            <>
                Schedule work with full flexibility, immediate dispatch, delayed
                execution, and recurring jobs. Uses Transaction Context for
                reliable execution.
            </>
        ),
    } satisfies ComponentItemProps,
    NOTIFICATIONS: {
        name: "Notifications",
        icon: <Bell size="1.5rem" strokeWidth={1.5} />,
        title: <>Notifications</>,
        description: (
            <>
                Send notifications through multiple channels, synchronous
                dispatching, immediate enqueueing, delayed enqueueing, and
                recurring messages. Planned adapters include Slack, Discord,
                email, SMS, and WebSocket (browser push). Relies on Transaction
                Context and Scheduler.
            </>
        ),
    } satisfies ComponentItemProps,
    REQUEST_REPLY: {
        name: "Request Reply",
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: <>Request Reply</>,
        description: (
            <>
                A request-reply messaging pattern for sending a message and
                awaiting a typed response. Supports timeouts, retries, and
                pluggable transport backends.
            </>
        ),
    } satisfies ComponentItemProps,
    MESSAGE_QUEUE: {
        name: "Message Queue",
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: <>Message Queue</>,
        description: (
            <>
                A message queue abstraction with pluggable backends (in-memory,
                Redis, SQS, RabbitMQ) for reliable async communication between
                services.
            </>
        ),
    } satisfies ComponentItemProps,
    IDEMPOTENT_CACHE: {
        name: "Idempotent Cache",
        icon: <Copy size="1.5rem" strokeWidth={1.5} />,
        title: <>Idempotent Cache</>,
        description: (
            <>
                Built-in idempotency support for the Job Scheduler and Event Bus
                to prevent duplicate job execution and event processing.
            </>
        ),
    } satisfies ComponentItemProps,
    OUTBOX_PATTERN: {
        name: "Outbox Pattern",
        icon: <Send size="1.5rem" strokeWidth={1.5} />,
        title: <>Outbox Pattern</>,
        description: (
            <>
                The transactional outbox pattern to reliably publish messages
                and events as part of a database transaction. Works with
                Transaction Context.
            </>
        ),
    } satisfies ComponentItemProps,
    INBOX_PATTERN: {
        name: "Inbox Pattern",
        icon: <Inbox size="1.5rem" strokeWidth={1.5} />,
        title: <>Inbox Pattern</>,
        description: (
            <>
                The transactional inbox pattern to reliably process incoming
                messages and events with deduplication. Works with Transaction
                Context.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_SECURITY_RECORD = {
    // ─── Upcoming: Security ──────────────────────────────────
    AUTHENTICATION: {
        name: "Authentication",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Authentication</>,
        description: (
            <>
                First-class support for username/password, email verification,
                OAuth, and WebAuthn, with a{" "}
                <a href="https://www.better-auth.com/">Better Auth</a>{" "}
                integration for batteries-included setups. Requires Sessions.
            </>
        ),
    } satisfies ComponentItemProps,
    SESSION_MANAGEMENT: {
        name: "Session Management",
        icon: <Users size="1.5rem" strokeWidth={1.5} />,
        title: <>Session Management</>,
        description: (
            <>
                Manage user sessions securely with a pluggable, adapter-driven
                API. Required by Authentication.
            </>
        ),
    } satisfies ComponentItemProps,
    AUTHORIZATION_GATES: {
        name: "Authorization Gates",
        icon: <Lock size="1.5rem" strokeWidth={1.5} />,
        title: <>Authorization Gates</>,
        description: (
            <>
                Gate primitives for fine-grained, policy-based access control.
                Works alongside Authentication.
            </>
        ),
    } satisfies ComponentItemProps,
    APACHE_CASBIN_INTEGRATION: {
        name: "Apache Casbin Integration",
        icon: <Lightbulb size="1.5rem" strokeWidth={1.5} />,
        title: <>Apache Casbin Integration</>,
        description: (
            <>
                Integration with <a href="https://casbin.org/">Casbin</a> for
                advanced authorization using attribute-based, role-based, and
                relationship-based access control models.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_INTEGRATIONS_RECORD = {
    // ─── Upcoming: Integrations ──────────────────────────────
    TEXT_SEARCH: {
        name: "Text Search",
        icon: <Search size="1.5rem" strokeWidth={1.5} />,
        title: <>Text Search</>,
        description: (
            <>
                A pluggable text search abstraction with adapter support for
                Elasticsearch, SQL databases, and MongoDB. Integrates with
                MikroORM and other ORMs to automatically synchronise your data
                with search indexes, synchronously or asynchronously.
            </>
        ),
    } satisfies ComponentItemProps,
    OPEN_API: {
        name: "OpenAPI",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>OpenAPI</>,
        description: (
            <>
                First-class OpenAPI support, define your API schema alongside
                your handlers and get spec generation, validation, and
                documentation out of the box.
            </>
        ),
    } satisfies ComponentItemProps,
    SQL_INTEGRATION: {
        name: "SQL Integration",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>SQL Integration</>,
        description: (
            <>
                Pluggable SQL database adapters for Drizzle, Kysely, MikroORM,
                TypeORM, Sequelize, Knex, Prisma (SQL) and raw drivers. Internal
                SQL adapters abstract the database layer while using Kysely as a
                raw SQL query string builder, write queries once, run against
                any supported ORM or raw driver.
            </>
        ),
    } satisfies ComponentItemProps,
    MONGOOSE_NATIVE_MONGODB_INTEGRATION: {
        name: "Mongoose and Native MongoDB Integration",
        icon: <Database size="1.5rem" strokeWidth={1.5} />,
        title: <>Mongoose and Native MongoDB Integration</>,
        description: (
            <>
                Native and performant MongoDB-backed implementations of every
                Eridu-tech component, rate limiters, circuit breakers, event
                bus, message queues, job schedulers, request-reply, transaction
                context, and cache, all using MongoDB as the persistence layer.
                No additional dependencies required.
            </>
        ),
    } satisfies ComponentItemProps,
    POSTGRESQL_NATIVE_INTEGRATION: {
        name: "PostgreSQL Native Integration",
        icon: <Server size="1.5rem" strokeWidth={1.5} />,
        title: <>PostgreSQL Native Integration</>,
        description: (
            <>
                Native and performant PostgreSQL-backed implementations of every
                Eridu-tech component, rate limiters, circuit breakers, locks,
                semaphores, shared locks, event bus, message queues, job
                schedulers, request-reply, transaction context, and cache, all
                using PostgreSQL as the persistence layer via Kysely. No
                additional dependencies required.
            </>
        ),
    } satisfies ComponentItemProps,
    SSH_DEPLOYMENT: {
        name: "SSH Deployment",
        icon: <Globe size="1.5rem" strokeWidth={1.5} />,
        title: <>SSH Deployment</>,
        description: (
            <>
                Deploy and manage Eridu-tech applications on any VPS or
                bare-metal server via SSH. Push builds, manage processes,
                configure environment, and run health checks, all from a single
                CLI command, no Docker or orchestration required.
            </>
        ),
    } satisfies ComponentItemProps,
    IMAGE_MANIPULATOR: {
        name: "Image Manipulator",
        icon: <Image size="1.5rem" strokeWidth={1.5} />,
        title: <>Image Manipulator</>,
        description: (
            <>
                A pluggable image manipulation component with adapter support
                for resize, crop, rotate, format conversion, and optimization,
                process images locally via Sharp or delegate to cloud services
                like Cloudinary and Imgix.
            </>
        ),
    } satisfies ComponentItemProps,
    PROCESS_MANAGER: {
        name: "Process Manager",
        icon: <Activity size="1.5rem" strokeWidth={1.5} />,
        title: <>Process Manager</>,
        description: (
            <>
                Fork, monitor, and manage worker processes with automatic
                restart, health checks, log management, and graceful shutdown.
                Supports cluster mode and zero-downtime reload for Node.js
                applications.
            </>
        ),
    } satisfies ComponentItemProps,
};

const UPCOMING_DEV_TOOLING_RECORD = {
    // ─── Upcoming: Dev Tooling ───────────────────────────────
    DI_AUTODISCOVERY_VITE_PLUGIN: {
        name: "DI Autodiscovery Vite Plugin",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>DI Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers DI
                container modules, no manual import wiring required for new
                components or services.
            </>
        ),
    } satisfies ComponentItemProps,
    EVENT_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Event Autodiscovery Vite Plugin",
        icon: <Radio size="1.5rem" strokeWidth={1.5} />,
        title: <>Event Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers event
                bus handlers and listeners.
            </>
        ),
    } satisfies ComponentItemProps,
    JOB_SCHEDULER_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Job Scheduler Autodiscovery Vite Plugin",
        icon: <Clock size="1.5rem" strokeWidth={1.5} />,
        title: <>Job Scheduler Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers
                scheduled job definitions.
            </>
        ),
    } satisfies ComponentItemProps,
    REQUEST_REPLY_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Request Reply Autodiscovery Vite Plugin",
        icon: <Reply size="1.5rem" strokeWidth={1.5} />,
        title: <>Request Reply Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers
                request-reply endpoints.
            </>
        ),
    } satisfies ComponentItemProps,
    MESSAGE_QUEUE_AUTODISCOVERY_VITE_PLUGIN: {
        name: "Message Queue Autodiscovery Vite Plugin",
        icon: <MessageSquare size="1.5rem" strokeWidth={1.5} />,
        title: <>Message Queue Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers message
                queue consumers and handlers.
            </>
        ),
    } satisfies ComponentItemProps,
    CLI_COMMAND_AUTODISCOVERY_VITE_PLUGIN: {
        name: "CLI Command Autodiscovery Vite Plugin",
        icon: <Terminal size="1.5rem" strokeWidth={1.5} />,
        title: <>CLI Command Autodiscovery Vite Plugin</>,
        description: (
            <>
                A Vite plugin that automatically discovers and registers CLI
                command definitions.
            </>
        ),
    } satisfies ComponentItemProps,
    SCAFFOLDING_CLI: {
        name: "Scaffolding CLI",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Scaffolding CLI</>,
        description: (
            <>
                Predefined CLI commands to scaffold Eridu-tech projects and
                components. Initialize a new Eridu-tech project from scratch or
                add individual components (DI, Cache, Scheduler, Auth, etc.) to
                an existing project, with sensible defaults, config files, and
                boilerplate code generated automatically.
            </>
        ),
    } satisfies ComponentItemProps,
};

export const COMPONENT_RECORD = {
    ...EXISTING_FOUNDATION_RECORD,
    ...EXISTING_STORAGE_RECORD,
    ...EXISTING_RELIABILITY_RECORD,
    ...EXISTING_CONCURRENCY_RECORD,
    ...EXISTING_MESSAGING_RECORD,
    ...EXISTING_WEB_RECORD,
    ...EXISTING_UTILITIES_RECORD,
    ...UPCOMING_FOUNDATION_RUNTIME_RECORD,
    ...UPCOMING_RELIABILITY_MESSAGING_RECORD,
    ...UPCOMING_SECURITY_RECORD,
    ...UPCOMING_INTEGRATIONS_RECORD,
    ...UPCOMING_DEV_TOOLING_RECORD,
};

// ─── Existing, Production-Ready Components ──────────────────────

export const FOUNDATION_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.EXECUTION_CONTEXT,
    COMPONENT_RECORD.TRANSACTION_CONTEXT,
    COMPONENT_RECORD.MIDDLEWARE_AND_AOP,
    COMPONENT_RECORD.SERDE,
    COMPONENT_RECORD.CODEC,
    COMPONENT_RECORD.TYPED_CONFIG_ACCESS,
    COMPONENT_RECORD.TYPED_ENV_ACCESS,
    COMPONENT_RECORD.DI_CONTAINER,
];

export const STORAGE_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.CACHE,
    COMPONENT_RECORD.FILE_STORAGE,
];

export const RELIABILITY_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.CIRCUIT_BREAKER,
    COMPONENT_RECORD.RATE_LIMITER,
    COMPONENT_RECORD.RESILIENCE,
];

export const CONCURRENCY_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.LOCK,
    COMPONENT_RECORD.SHARED_LOCK,
    COMPONENT_RECORD.SEMAPHORE,
];

export const MESSAGING_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.EVENT_BUS,
];

export const WEB_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.HTTP_ROUTER,
];

export const UTILITIES_EXISTING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.COLLECTION,
    COMPONENT_RECORD.TIME_SPAN,
    COMPONENT_RECORD.FILE_SIZE,
    COMPONENT_RECORD.BACKOFF_POLICIES,
    COMPONENT_RECORD.ERROR_POLICY_TYPE,
    COMPONENT_RECORD.INVOCABLE,
];

export const EXISTING_ITEMS: ComponentItemProps[] = [
    ...FOUNDATION_EXISTING_ITEMS,
    ...STORAGE_EXISTING_ITEMS,
    ...RELIABILITY_EXISTING_ITEMS,
    ...CONCURRENCY_EXISTING_ITEMS,
    ...MESSAGING_EXISTING_ITEMS,
    ...WEB_EXISTING_ITEMS,
    ...UTILITIES_EXISTING_ITEMS,
];

// ─── Existing Middlewares ───────────────────────────────────────

export const STORAGE_MIDDLEWARE_ITEMS: ComponentItemProps[] = [
    {
        name: "withCacheFactory",
        title: <>withCacheFactory</>,
        link: "/docs/storage/cache/cache_middlewares/#with_cache_factory_middleware",
        description: <>Caches the wrapped function&apos;s return value.</>,
    },
    {
        name: "withInvalidationFactory",
        title: <>withInvalidationFactory</>,
        link: "/docs/storage/cache/cache_middlewares/#with_invalidation_factory_middleware",
        description: (
            <>Invalidates a cache entry after the wrapped function runs.</>
        ),
    },
];

export const RELIABILITY_MIDDLEWARE_ITEMS: ComponentItemProps[] = [
    {
        name: "withCircuitBreakerFactory",
        title: <>withCircuitBreakerFactory</>,
        link: "/docs/reliability/circuit_breaker/circuit_breaker_middlewares/#with_circuit_breaker_factory_middleware",
        description: <>Wraps function calls with a circuit breaker.</>,
    },
    {
        name: "withRateLimiterFactory",
        title: <>withRateLimiterFactory</>,
        link: "/docs/reliability/rate-limiter/rate_limiter_middlewares/#with_rate_limiter_factory_middleware",
        description: <>Wraps function calls with a rate limiter.</>,
    },
    {
        name: "fallback",
        title: <>fallback</>,
        link: "/docs/reliability/resilience/#fallback",
        description: (
            <>Returns a fallback value when the wrapped function fails.</>
        ),
    },
    {
        name: "retry",
        title: <>retry</>,
        link: "/docs/reliability/resilience/#retry",
        description: (
            <>
                Retries the wrapped function up to a maximum number of attempts.
            </>
        ),
    },
    {
        name: "retryInterval",
        title: <>retryInterval</>,
        link: "/docs/reliability/resilience/#retry_by_interval",
        description: (
            <>
                Retries the wrapped function at a fixed interval until it
                succeeds or the time budget is exhausted.
            </>
        ),
    },
    {
        name: "timeout",
        title: <>timeout</>,
        link: "/docs/reliability/resilience/#timeout",
        description: (
            <>
                Rejects the wrapped function if it does not complete within a
                duration.
            </>
        ),
    },
];

export const CONCURRENCY_MIDDLEWARE_ITEMS: ComponentItemProps[] = [
    {
        name: "withLockFactory",
        title: <>withLockFactory</>,
        link: "/docs/concurrency/lock/lock_middlewares/#with_lock_factory_middleware",
        description: <>Wraps function calls with a distributed lock.</>,
    },
    {
        name: "withSemaphoreFactory",
        title: <>withSemaphoreFactory</>,
        link: "/docs/concurrency/semaphore/semaphore_middlewares/#with_semaphore_factory_middleware",
        description: <>Wraps function calls with a distributed semaphore.</>,
    },
    {
        name: "withSharedLockFactory",
        title: <>withSharedLockFactory</>,
        link: "/docs/concurrency/shared_lock/shared_lock_middlewares/#with_shared_lock_factory_middleware",
        description: (
            <>Wraps function calls with a shared (reader-writer) lock.</>
        ),
    },
];

export const MESSAGING_MIDDLEWARE_ITEMS: ComponentItemProps[] = [
    {
        name: "withDispatchBeforeFactory",
        title: <>withDispatchBeforeFactory</>,
        link: "/docs/messaging/event_bus/event_bus_middlewares/#with_dispatch_before_factory_middleware",
        description: <>Dispatches an event before the wrapped function runs.</>,
    },
    {
        name: "withDispatchAfterFactory",
        title: <>withDispatchAfterFactory</>,
        link: "/docs/messaging/event_bus/event_bus_middlewares/#with_dispatch_after_factory_middleware",
        description: (
            <>Dispatches an event after the wrapped function resolves.</>
        ),
    },
    {
        name: "withDispatchOnErrorFactory",
        title: <>withDispatchOnErrorFactory</>,
        link: "/docs/messaging/event_bus/event_bus_middlewares/#with_dispatch_on_error_factory_middleware",
        description: <>Dispatches an event when the wrapped function throws.</>,
    },
];

// ─── Foundation & Runtime ────────────────────────────────────────

export const FOUNDATION_RUNTIME_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.CLI_COMMAND,
    COMPONENT_RECORD.STRUCTURED_CONCURRENCY,
    COMPONENT_RECORD.PROMISE_QUEUE,
    COMPONENT_RECORD.LOGGING_OBSERVABILITY,
    COMPONENT_RECORD.INTROSPECTION,
];

// ─── Reliability & Messaging ─────────────────────────────────────

export const RELIABILITY_MESSAGING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.JOB_SCHEDULER,
    COMPONENT_RECORD.NOTIFICATIONS,
    COMPONENT_RECORD.REQUEST_REPLY,
    COMPONENT_RECORD.MESSAGE_QUEUE,
    COMPONENT_RECORD.IDEMPOTENT_CACHE,
    COMPONENT_RECORD.OUTBOX_PATTERN,
    COMPONENT_RECORD.INBOX_PATTERN,
];

// ─── Security ────────────────────────────────────────────────────

export const SECURITY_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.AUTHENTICATION,
    COMPONENT_RECORD.SESSION_MANAGEMENT,
    COMPONENT_RECORD.AUTHORIZATION_GATES,
    COMPONENT_RECORD.APACHE_CASBIN_INTEGRATION,
];

// ─── Integrations ────────────────────────────────────────────────

export const INTEGRATIONS_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.TEXT_SEARCH,
    COMPONENT_RECORD.OPEN_API,
    COMPONENT_RECORD.SQL_INTEGRATION,
    COMPONENT_RECORD.MONGOOSE_NATIVE_MONGODB_INTEGRATION,
    COMPONENT_RECORD.POSTGRESQL_NATIVE_INTEGRATION,
    COMPONENT_RECORD.SSH_DEPLOYMENT,
    COMPONENT_RECORD.IMAGE_MANIPULATOR,
    COMPONENT_RECORD.PROCESS_MANAGER,
];

// ─── Dev Tooling ─────────────────────────────────────────────────

export const DEV_TOOLING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.DI_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.EVENT_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.JOB_SCHEDULER_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.REQUEST_REPLY_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.MESSAGE_QUEUE_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.CLI_COMMAND_AUTODISCOVERY_VITE_PLUGIN,
    COMPONENT_RECORD.SCAFFOLDING_CLI,
];

// ─── Homepage preview subset ─────────────────────────────────────

export const UPCOMING_ITEMS: ComponentItemProps[] = [
    COMPONENT_RECORD.CLI_COMMAND,
    COMPONENT_RECORD.STRUCTURED_CONCURRENCY,
    COMPONENT_RECORD.PROMISE_QUEUE,
    COMPONENT_RECORD.LOGGING_OBSERVABILITY,
    COMPONENT_RECORD.INTROSPECTION,
    COMPONENT_RECORD.JOB_SCHEDULER,
];

// ─── Homepage Data ─────────────────────────────────────────────

export const FEATURE_ITEMS = {
    EMBEDDABLE_BY_DESIGN: {
        name: "Embeddable by design",
        icon: <Box size="1.5rem" strokeWidth={1.5} />,
        title: <>Embeddable by design</>,
        description: (
            <>
                Use Eridu inside the framework you already know. Embed it into
                Next.js, TanStack Start, Nuxt, or other fullstack frameworks
                without taking over your application&apos;s routing, rendering,
                or deployment model.
            </>
        ),
    } satisfies FeatureItemProps,
    COMPOSE_ONLY_WHAT_YOU_NEED: {
        name: "Compose only what you need",
        icon: <Plug size="1.5rem" strokeWidth={1.5} />,
        title: <>Compose only what you need</>,
        description: (
            <>
                Eridu is built from independent, composable capabilities. Add
                HTTP routing, dependency injection, cache, storage, events,
                queues, CLI, serialization, transactions, and more as your
                application needs them, without adopting an all-or-nothing
                framework runtime.
            </>
        ),
    } satisfies FeatureItemProps,
    OWN_AND_CUSTOMIZE_YOUR_CODE: {
        name: "Own and customize your code",
        icon: <Wrench size="1.5rem" strokeWidth={1.5} />,
        title: <>Own and customize your code</>,
        description: (
            <>
                Inspired by the shadcn approach, Eridu is designed to let you
                build with code you control. Scaffold the capabilities you need
                into your application, customize them freely, and extend them
                without being locked into opaque framework internals.
            </>
        ),
    } satisfies FeatureItemProps,
    SWITCH_INFRASTRUCTURE_WITHOUT_REWRITING_BUSINESS_LOGIC: {
        name: "Switch infrastructure without rewriting business logic",
        icon: <Zap size="1.5rem" strokeWidth={1.5} />,
        title: <>Switch infrastructure without rewriting business logic</>,
        description: (
            <>
                Adapters keep your application decoupled from infrastructure
                vendors. Use Redis today and switch to another implementation
                tomorrow without rewriting the business logic built on top of
                it.
            </>
        ),
    } satisfies FeatureItemProps,
    SMALL_RUNTIME_FOOTPRINT: {
        name: "Small runtime footprint",
        icon: <Leaf size="1.5rem" strokeWidth={1.5} />,
        title: <>Small runtime footprint</>,
        description: (
            <>
                Because capabilities are independently composable, you
                don&apos;t need to carry an entire framework runtime when you
                only use a few parts of Eridu. Optional drivers and integrations
                are added only when your application actually needs them.
            </>
        ),
    } satisfies FeatureItemProps,
    BATTERIES_INCLUDED: {
        name: "Batteries included",
        icon: <BatteryFull size="1.5rem" strokeWidth={1.5} />,
        title: <>Batteries included</>,
        description: (
            <>
                Eridu provides a broad set of production-ready capabilities and
                integrations so you don&apos;t have to assemble your backend
                infrastructure from unrelated libraries. Start with a cohesive
                foundation and add more as your application grows.
            </>
        ),
    } satisfies FeatureItemProps,
};

export const PERFECT_FOR = {
    FULLSTACK_TYPESCRIPT_APPLICATIONS: {
        name: "Fullstack TypeScript applications:",
        title: <>Fullstack TypeScript applications:</>,
        description: (
            <>
                Build complete applications with a frontend and backend in the
                same project, while using Eridu for DI, HTTP, cache, storage,
                events, queues, CLI, transactions, serialization, and other
                backend capabilities.
            </>
        ),
    } satisfies WhoIsThisForItem,
    DEVELOPERS_WHO_WANT_FRAMEWORK_FLEXIBILITY: {
        name: "Developers who want framework flexibility:",
        title: <>Developers who want framework flexibility:</>,
        description: (
            <>
                Use Eridu without being locked into a specific frontend or
                fullstack framework. Its boundaries are designed to integrate
                with different routers, runtimes, and execution environments.
            </>
        ),
    } satisfies WhoIsThisForItem,
    COMPOSABLE_ARCHITECTURES: {
        name: "Composable architectures:",
        title: <>Composable architectures:</>,
        description: (
            <>
                Add only the capabilities your application needs and combine
                them into a single coherent foundation instead of adopting an
                all-or-nothing backend stack.
            </>
        ),
    } satisfies WhoIsThisForItem,
    FRAMEWORK_STYLE_DEVELOPMENT_WITHOUT_FRAMEWORK_LOCK_IN: {
        name: "Framework-style development without framework lock-in:",
        title: <>Framework-style development without framework lock-in:</>,
        description: (
            <>
                Get conventions for controllers, DI, routing, middleware,
                validation, events, queues, scheduling, and infrastructure
                adapters while keeping ownership of your application code and
                composition.
            </>
        ),
    } satisfies WhoIsThisForItem,
    SHADCN_STYLE_OWNERSHIP: {
        name: "Shadcn-style ownership:",
        title: <>Shadcn-style ownership:</>,
        description: (
            <>
                Scaffold capabilities into your project, customize them to fit
                your application, and extend the generated code instead of
                depending on opaque framework internals.
            </>
        ),
    } satisfies WhoIsThisForItem,
    MODULAR_MONOLITHS: {
        name: "Modular monoliths:",
        title: <>Modular monoliths:</>,
        description: (
            <>
                Build multiple application domains and vertical slices on top of
                a shared DI container and infrastructure foundation while
                keeping modules independently composable.
            </>
        ),
    } satisfies WhoIsThisForItem,
};

export const NOT_IDEAL_FOR = {
    FRONTEND_ONLY_APPLICATIONS: {
        name: "Frontend-only applications:",
        title: <>Frontend-only applications:</>,
        description: (
            <>
                eridu-tech is focused on server-side and fullstack applications
                rather than browser-only applications.
            </>
        ),
    } satisfies WhoIsThisForItem,
    MICROSERVICES_AS_PRIMARY_ARCHITECTURE: {
        name: "Microservices as the primary architecture:",
        title: <>Microservices as the primary architecture:</>,
        description: (
            <>
                Eridu is particularly well suited to modular monoliths and
                cohesive applications where infrastructure and domain modules
                can share a runtime and common abstractions. Individual Eridu
                capabilities can still be used in distributed systems and
                services.
            </>
        ),
    } satisfies WhoIsThisForItem,
    PROJECTS_TIGHTLY_COUPLED_TO_ONE_VENDOR: {
        name: "Projects tightly coupled to one vendor:",
        title: <>Projects tightly coupled to one vendor:</>,
        description: (
            <>
                If your application intentionally depends on provider-specific
                APIs and features, Eridu&apos;s abstraction and adapter model
                may provide little benefit.
            </>
        ),
    } satisfies WhoIsThisForItem,
    APPLICATIONS_REQUIRING_PROVIDER_SPECIFIC_CAPABILITIES: {
        name: "Applications requiring provider-specific capabilities:",
        title: <>Applications requiring provider-specific capabilities:</>,
        description: (
            <>
                Generic abstractions may not expose every feature of a
                particular database, cloud platform, or infrastructure provider.
                In those cases, using the provider&apos;s native SDK directly
                may be more appropriate.
            </>
        ),
    } satisfies WhoIsThisForItem,
    VERY_SMALL_SCRIPTS: {
        name: "Very small scripts:",
        title: <>Very small scripts:</>,
        description: (
            <>
                If you only need a single Redis call, file upload, or cache
                operation, introducing a framework-level abstraction may be
                unnecessary.
            </>
        ),
    } satisfies WhoIsThisForItem,
    PURE_JAVASCRIPT_PROJECTS_PRIORITIZING_MINIMAL_ABSTRACTION: {
        name: "Pure JavaScript projects prioritizing minimal abstraction:",
        title: <>Pure JavaScript projects prioritizing minimal abstraction:</>,
        description: (
            <>
                eridu-tech is designed primarily for TypeScript and makes
                extensive use of its type system, generics, and inference for
                the best developer experience.
            </>
        ),
    } satisfies WhoIsThisForItem,
};

// ─── Code Showcase ────────────────────────────────────────────

export const CODE_FILES = {
    MAIN: {
        name: "main.ts",
        code: `import { lockFactory } from "./lock-factory.js";
import { cache } from "./cache.js";

// The LockFactory class uses Serde instance
// internally to register custom serialization logic
const lock = lockFactory.create("payment:order-42");

// The underlying RedisCacheAdapter uses by Cache class
// uses the Serde class to serialize and deserialize
// Will automatically serialize correctly
await cache.put(lock.key, lock);

// Will automatically deserialize correctly
const deserializedLock = await cache.get(lock.key);`,
    } satisfies CodeFile,
    LOCK_FACTORY: {
        name: "lock-factory.ts",
        code: `import { LockFactory } from "eridu-tech/lock";
import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { serde } from "./serde.js";

export const lockFactory = new LockFactory({
    adapter: new RedisLockAdapter(redis),
    serde,
});`,
    } satisfies CodeFile,
    CACHE: {
        name: "cache.ts",
        code: `import { Cache } from "eridu-tech/cache";
import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { serde } from "./serde.js";

export const cache = new Cache({
    adapter: new RedisCacheAdapter({
        database: redis,
        serde,
    }),
});`,
    } satisfies CodeFile,
    SERDE: {
        name: "serde.ts",
        code: `import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";

export const serde = new Serde(new SuperJsonSerdeAdapter());`,
    } satisfies CodeFile,
    EXECUTION_CONTEXT: {
        name: "main.ts",
        code: `import { Cache } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";

// A single context instance shared by every context-aware component
const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

// Cache and EventBus receive the same ExecutionContext (IReadableContext)
const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
    context: executionContext,
});
const eventBus = new EventBus({
    adapter: new MemoryEventBusAdapter(),
    context: executionContext,
});`,
    } satisfies CodeFile,
    MIDDLEWARE: {
        name: "middleware.ts",
        code: `import { use } from "eridu-tech/middleware";
import { retry, timeout } from "eridu-tech/resilience";
import { TimeSpan } from "eridu-tech/time-span";

const fetchUser = async (id: string) => {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return res.json();
};

const resilientFetch = use(fetchUser, [
    timeout({ waitTime: TimeSpan.fromSeconds(5) }),
    retry({ maxAttempts: 3, throwLastError: true }),
]);

// Times out after 5s per attempt, retries up to 3 times
const user = await resilientFetch("42");`,
    } satisfies CodeFile,
    ENHANCE: {
        name: "enhance.ts",
        code: `import { enhance, defineMiddleware } from "eridu-tech/middleware";
import { retry, timeout } from "eridu-tech/resilience";
import { TimeSpan } from "eridu-tech/time-span";

class UserService {
    async getUser(id: string) {
        const res = await fetch(\`/api/users/\${id}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
    }
}

const service = new UserService();
enhance(service, "getUser", [
    timeout({ waitTime: TimeSpan.fromSeconds(10) }),
    retry({ maxAttempts: 3, throwLastError: true }),
]);

await service.getUser("42");
// Retries up to 3 times on failure
// Throws if a single attempt takes longer than 10s`,
    } satisfies CodeFile,
    PLUGIN: {
        name: "plugin.ts",
        code: `import { withPlugin, type PluginFn } from "eridu-tech/middleware";
import { retry, timeout } from "eridu-tech/resilience";
import { TimeSpan } from "eridu-tech/time-span";

class Fetcher {
    async getUser(id: string) {
        const res = await fetch(\`/api/users/\${id}\`);
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
    }
}

// Reusable plugin factory, apply to any service
const withRetryAndTimeout: PluginFn<Fetcher> = () =>
    (instance, enhance) => {
        enhance(instance, "getUser", [
            timeout({ waitTime: TimeSpan.fromSeconds(10) }),
            retry({ maxAttempts: 3, throwLastError: true }),
        ]);
    };

const fetcher = withPlugin(new Fetcher(), [withRetryAndTimeout()]);

await fetcher.getUser("42");
// Retries up to 3 times, each attempt times out after 10s`,
    } satisfies CodeFile,
    APP_API_USERS_ROUTE: {
        name: "app/api/users/route.ts",
        code: `import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { z } from "zod";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter,
});

const jsonSchema = z.object({
    name: z.string(),
    email: z.string().email()
});
router.endpoint({
    url: "/",
    method: "POST",
    handler: async ({ req, json }) => {
        const { json: validatedJson } = await req.withSchema({
          json: jsonSchema
        });
        return json({ success: true, ...validatedJson });
    },
});

export const GET: RequestHandler = async ({ request }) => router.fetch(request);
export const POST: RequestHandler = async ({ request }) => router.fetch(request);
export const PUT: RequestHandler = async ({ request }) => router.fetch(request);
export const DELETE: RequestHandler = async ({ request }) => router.fetch(request);
export const PATCH: RequestHandler = async ({ request }) => router.fetch(request);`,
    } satisfies CodeFile,
    CONFIG_ACCESSOR: {
        name: "config.ts",
        code: `import { ConfigAccessor } from "eridu-tech/config-accessor";
import { z } from "zod";

// Typed schema for domain configuration
// Supports primitives, nested objects, and arrays
const schema = z.object({
    database: z.object({
        host: z.string(),
        port: z.number(),
    }),
    features: z.string().array(),
});

const accessor = new ConfigAccessor({
    config: {
        database: { host: "localhost", port: 5432 },
        features: ["cache", "queue"],
    },
    // Schema is optional, a type works just as well
    schema,
});

// Type-safe reads with full autocompletion
const host = accessor.get("database.host");
const port = accessor.getOr("database.port", 5432);
const missing = accessor.get("database.user"); // null`,
    } satisfies CodeFile,
    ENV_ACCESSOR: {
        name: "env.ts",
        code: `import { EnvAccessor } from "eridu-tech/env-accessor";
import { z } from "zod";
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// Multiple sources, later sources override earlier keys
const secretsManager = new SecretsManagerClient({ region: "us-east-1" });
const sources = [
    process.env,
    async () => {
        const secret = await secretsManager.send(
            new GetSecretValueCommand({ SecretId: "my-app/env" }),
        );
        return JSON.parse(secret.SecretString ?? "{}");
    },
];

const schema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.string().pipe(z.coerce.number()).default("3000"),
});

const accessor = new EnvAccessor({ schema, sources });
await accessor.init();

// Type-safe reads with full autocompletion
const port = accessor.get("PORT");
const env = accessor.getOr("NODE_ENV", "DEV");`,
    } satisfies CodeFile,
};

// ─── Landing page: component code tabs ──────────────────────────
// Tab metadata and the verbatim raw sample imports live in home-tabs.ts.
export { COMPONENT_CODE_TABS } from "./home-tabs.js";

// ─── Framework Comparison ─────────────────────────────────────

export const COMPARISONS = {
    NESTJS: {
        name: "NestJS",
        heading:
            "An application-owning backend framework vs an embeddable, composable framework.",
        instead: [
            "Built around a Nest application and module graph with controllers, providers, and dependency injection.",
            "Decorators and framework modules are central to the application model.",
            "The primary composition model is a Nest application, with Nest owning the backend runtime and application lifecycle.",
            "Application code follows Nest's module and framework conventions.",
            "Infrastructure is commonly integrated through Nest-specific modules and providers.",
            "Designed for backend applications including monoliths and microservices.",
            "Framework abstractions remain part of the application architecture.",
        ],
        eriduTech: [
            "Embeddable backend framework that can live inside Next.js, TanStack Start, Nuxt, and other fullstack frameworks.",
            "Plain TypeScript classes and explicit composition, no decorators required.",
            "Eridu provides the backend framework layer while the host framework can remain responsible for the frontend, and deployment.",
            "Compose routers, controllers, services, DI, middleware, and infrastructure explicitly.",
            "Own adapter-based primitives for cache, storage, locks, events, queues, and more.",
            "Designed primarily for composable applications and modular monoliths.",
            "Scaffold capabilities into your application and own the resulting source code, inspired by the shadcn approach.",
        ],
    } satisfies ComparisonItem,

    ADONISJS: {
        name: "AdonisJS",
        heading:
            "An application-centric full-stack framework vs an embeddable, composable backend framework.",
        instead: [
            "Provides an application runtime with IoC, routing, service providers, lifecycle management, and CLI tooling.",
            "Application composition is organized around the AdonisJS application and its provider lifecycle.",
            "Framework conventions define how services, routes, commands, and other application concerns are registered.",
            "The framework owns the application lifecycle and coordinates HTTP and command execution.",
            "AdonisJS provides an integrated framework ecosystem rather than a backend layer designed to sit inside another fullstack framework.",
            "Packages extend the AdonisJS application through its provider and configuration model.",
        ],
        eriduTech: [
            "Embeds into an existing fullstack framework instead of requiring Eridu to own the entire application.",
            "Compose DI, routers, controllers, middleware, services, and infrastructure around the host framework.",
            "No prescribed application structure; organize your code around your own domains and vertical slices.",
            "HTTP, CLI, events, queues, and scheduled work all follow the same router/controller/DI binding and registration api.",
            "Use Eridu's capabilities independently while sharing common execution context, serialization, middleware, and transaction abstractions.",
            "Scaffold the capabilities you need into your project and customize the source instead of depending on an opaque application runtime.",
        ],
    } satisfies ComparisonItem,

    TRPC_ORPC: {
        name: "tRPC / oRPC",
        heading: "Typed RPC transport vs an embeddable backend framework.",
        instead: [
            "Focused on typed RPC between callers and server-side procedures.",
            "Excellent for sharing TypeScript types across the client-server boundary.",
            "Procedures and middleware form the primary application programming model.",
            "Provides transport-level composition rather than a complete backend application foundation.",
        ],
        eriduTech: [
            "Provides the backend framework and infrastructure behind your RPC layer.",
            "Use DI-managed services and controllers from tRPC or oRPC procedures.",
            "Provides reusable backend capabilities such as cache, locks, rate limiting, events, queues, scheduling, transactions, and serialization.",
            "Also provides HTTP and CLI application boundaries, not just client-server RPC.",
            "Complementary rather than competitive: use tRPC or oRPC for typed RPC and Eridu for the backend application layer.",
        ],
    } satisfies ComparisonItem,

    FULLSTACK_FRAMEWORKS: {
        name: "Next.js, Nuxt, etc.",
        heading:
            "A web-focused fullstack framework vs an embeddable backend framework.",
        instead: [
            "Provide frontend application architecture together with routing, rendering, and server-side capabilities.",
            "Define their own server routes, server functions, middleware, and application boundaries.",
            "Excellent starting points for building and deploying fullstack web applications.",
            "Their backend APIs are designed around the conventions of the host framework.",
            "Backend infrastructure often needs to be assembled from additional libraries and application-specific code.",
        ],
        eriduTech: [
            "Does not replace the frontend framework; it embeds into it as the backend framework layer.",
            "Host frameworks can own frontend routing, rendering, and deployment while Eridu owns backend composition.",
            "Connect host routes, server functions, or virtual routes to Eridu's DI-managed controllers and services.",
            "Provides a consistent backend programming model across HTTP, CLI, events, queues, and scheduled work.",
            "Portable backend capabilities can move between a fullstack application, standalone server, worker, or other supported host.",
        ],
    } satisfies ComparisonItem,

    COMPOSING_YOUR_OWN_STACK: {
        name: "Composing your own stack",
        heading:
            "Hand-picked libraries vs a consistent, composable framework you can own.",
        instead: [
            "Maximum freedom: choose individual libraries and infrastructure for every concern.",
            "Ideal when you only need one or two focused primitives or provider-specific features.",
            "You control every dependency and abstraction boundary.",
            "There is no shared application model between the libraries you choose.",
            "As the stack grows, you are responsible for connecting lifecycle, DI, context, middleware, errors, and infrastructure conventions.",
        ],
        eriduTech: [
            "Compose multiple backend capabilities within one consistent framework model.",
            "Get shared conventions for DI, controllers, routers, middleware, execution context, serialization, and infrastructure.",
            "Keep the flexibility of adapters and explicit composition without wiring every subsystem together yourself.",
            "Scaffold the framework capabilities into your application and own, modify, and extend the source.",
            "Adopt incrementally: start with what you need and add capabilities as the application grows.",
        ],
    } satisfies ComparisonItem,
};
