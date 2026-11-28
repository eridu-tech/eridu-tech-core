import { MongodbEventBusAdapter } from "eridu-tech/event-bus/mongodb-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { MongoClient } from "mongodb";

const serde = new SuperJsonSerde();
const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");

export const mongodbEventBusAdapter = new MongodbEventBusAdapter({
    database,
    serde,
    collectionName: "eventBus",
});

// You need to initialize the adapter once before using it.
// During the initialization the `sendAt` TTL index is created.
await mongodbEventBusAdapter.init();
