import { serde } from "./serde-initial-config.js";

const serializedValue = await serde.serialize({
    name: "abra",
    age: 20,
});

const deserializedValue = await serde.deserialize(serializedValue);
