import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { TimeSpan } from "eridu-tech/time-span";

const serde = new SuperJsonSerde();

serde.registerCustom(TimeSpan.serdeTransformer);

const timeSpan = TimeSpan.fromSeconds(12);
const serializedTimeSpan = await serde.serialize(timeSpan);
const deserializedTimeSpan = await serde.deserialize(serializedTimeSpan);

// logs false
console.log(serializedTimeSpan === deserializedTimeSpan);
