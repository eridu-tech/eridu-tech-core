import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        tags: [
            {
                name: "Postgres",
                description: "All Postgres tests",
            },
            {
                name: "Mongodb",
                description: "All Mongodb tests",
            },
            {
                name: "Redis",
                description: "All Redis tests",
            },
            {
                name: "Memory",
                description: "All Memory tests",
            },
            {
                name: "FS",
                description: "All file system tests",
            },
            {
                name: "FTP",
                description: "All FTP tests",
            },
            {
                name: "SFTP",
                description: "All SFTP tests",
            },
            {
                name: "WebDAV",
                description: "All SFTP tests",
            },
            {
                name: "S3",
                description: "All S3 tests",
            },
            {
                name: "Contracts",
                description: "All contract tests",
            },
            {
                name: "Adapters",
                description: "All adapter tests",
            },
            {
                name: "Derivables",
                description: "All derivable tests",
            },
            {
                name: "Middlewares",
                description: "All middleware tests",
            },
            {
                name: "Plugins",
                description: "All plugin tests",
            },
            {
                name: "Implementations",
                description: "All implementation tests",
            },
            {
                name: "Utilities",
                description: "All utility tests",
            },
            {
                name: "BackoffPolicies",
                description: "All backoff-policies tests",
            },
            {
                name: "Cache",
                description: "All cache tests",
            },
            {
                name: "CircuitBreaker",
                description: "All circuit-breaker tests",
            },
            {
                name: "Codec",
                description: "All codec tests",
            },
            {
                name: "Collection",
                description: "All collection tests",
            },
            {
                name: "ConfigAccessor",
                description: "All config-accessor tests",
            },
            {
                name: "Di",
                description: "All di tests",
            },
            {
                name: "EnvAccessor",
                description: "All env-accessor tests",
            },
            {
                name: "EventBus",
                description: "All event-bus tests",
            },
            {
                name: "ExecutionContext",
                description: "All execution-context tests",
            },
            {
                name: "FileSize",
                description: "All file-size tests",
            },
            {
                name: "FileStorage",
                description: "All file-storage tests",
            },
            {
                name: "GenericPool",
                description: "All generic-pool tests",
            },
            {
                name: "HttpRouter",
                description: "All http-router tests",
            },
            {
                name: "Lock",
                description: "All lock tests",
            },
            {
                name: "Log",
                description: "All log tests",
            },
            {
                name: "Middleware",
                description: "All middleware tests",
            },
            {
                name: "RateLimiter",
                description: "All rate-limiter tests",
            },
            {
                name: "Resilience",
                description: "All resilience tests",
            },
            {
                name: "Secret",
                description: "All secret tests",
            },
            {
                name: "Semaphore",
                description: "All semaphore tests",
            },
            {
                name: "Serde",
                description: "All serde tests",
            },
            {
                name: "SharedLock",
                description: "All shared-lock tests",
            },
            {
                name: "TestUtilities",
                description: "All test-utilities tests",
            },
            {
                name: "TimeSpan",
                description: "All time-span tests",
            },
            {
                name: "TransactionContext",
                description: "All transaction-context tests",
            },
        ],
    },
});
