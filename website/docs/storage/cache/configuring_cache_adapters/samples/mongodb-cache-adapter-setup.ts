import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { MongoClient } from "mongodb";

export const serde = new Serde(new SuperJsonSerdeAdapter());

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
export const database = client.db("database");
