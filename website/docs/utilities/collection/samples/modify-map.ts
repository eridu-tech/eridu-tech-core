import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 2, 3]).map((value) => value * value);

// Logs [1, 4, 9]
console.log(collection.toArray());
