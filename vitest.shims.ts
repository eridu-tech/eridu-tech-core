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
    | "Implementations";

declare module "vitest" {
    interface TestTags {
        tags: Infra;
    }
}
