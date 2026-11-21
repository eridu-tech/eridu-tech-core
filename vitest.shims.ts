import "vitest";

type Infra =
    | "Postgres"
    | "Mongodb"
    | "Redis"
    | "FS"
    | "FTP"
    | "SFTP"
    | "WebDAV"
    | "S3"
    | "Memory"
    | "Utilities"
    | "Contracts"
    | "Adapters"
    | "Derivables"
    | "Middlewares"
    | "Plugins"
    | "Implementations"
    | "BackoffPolicies"
    | "Cache"
    | "CircuitBreaker"
    | "Codec"
    | "Collection"
    | "ConfigAccessor"
    | "Di"
    | "EnvAccessor"
    | "EventBus"
    | "ExecutionContext"
    | "FileSize"
    | "FileStorage"
    | "GenericPool"
    | "HttpRouter"
    | "Lock"
    | "Log"
    | "Middleware"
    | "RateLimiter"
    | "Resilience"
    | "Secret"
    | "Semaphore"
    | "Serde"
    | "SharedLock"
    | "TestUtilities"
    | "TimeSpan"
    | "TransactionContext";

declare module "vitest" {
    interface TestTags {
        tags: Infra;
    }
}
