import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 2, 3]);
const value = collection.getOrFail(1);
// Logs 2
console.log(value);

// throws error
const value2 = collection.getOrFail(5);
