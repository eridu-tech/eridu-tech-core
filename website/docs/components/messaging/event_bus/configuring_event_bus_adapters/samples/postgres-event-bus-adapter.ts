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
    channelName: "eridu_tech_event_bus",
});
