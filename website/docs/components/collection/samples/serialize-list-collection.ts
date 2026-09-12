import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { ListCollection, IterableCollection } from "eridu-tech/collection";

const serde = new Serde(new SuperJsonSerdeAdapter());

serde.registerCustom(ListCollection.serdeTransformer);
serde.registerCustom(IterableCollection.serdeTransformer);

const listCollection = new ListCollection([1, 2, 3, 4, 5]);
const serializedListCollection = serde.serialize(listCollection);
const deserializedListCollection = serde.deserialize<ListCollection>(serializedListCollection);

// Logs false
console.log(listCollection === deserializedListCollection);
// Logs [1, 2, 3, 4, 5] [1, 2, 3, 4, 5]
console.log(listCollection.toArray(), deserializedListCollection.toArray());
