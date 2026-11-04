import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { TimeSpan } from "eridu-tech/time-span";

const serde = new SuperJsonSerde();

serde.registerCustom(TimeSpan.serdeTransformer);

const timeSpan = TimeSpan.fromSeconds(12);
const serializedTimeSpan = serde.serialize(timeSpan);
const deserializedTimeSpan = serde.deserialize(serializedTimeSpan);

// logs false
console.log(serializedTimeSpan === deserializedTimeSpan);
