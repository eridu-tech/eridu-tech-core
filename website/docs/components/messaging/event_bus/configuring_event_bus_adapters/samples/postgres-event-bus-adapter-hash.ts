import { createHash } from "node:crypto";

import { PostgresEventBusAdapter } from "eridu-tech/event-bus/postgres-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Client } from "pg";

const serde = new SuperJsonSerde();
const client = new Client({
    connectionString: "YOUR_POSTGRES_CONNECTION_STRING",
});
await client.connect();

export const postgresEventBusAdapter = new PostgresEventBusAdapter({
    client,
    serde,
    channelName: "my.service.domain.events",

    // PostgreSQL identifiers are limited to 63 bytes, so map the channel
    // name onto a short, deterministic identifier.
    hash: (channelName) =>
        `eridu_${createHash("sha256").update(channelName).digest("hex")}`.slice(
            0,
            63,
        ),
});
