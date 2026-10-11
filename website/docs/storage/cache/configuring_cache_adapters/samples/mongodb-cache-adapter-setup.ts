import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { MongoClient } from "mongodb";

export const serde = new SuperJsonSerde();

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
export const database = client.db("database");
