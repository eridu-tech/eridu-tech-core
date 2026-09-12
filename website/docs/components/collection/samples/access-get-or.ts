import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 2, 3]);
const value = collection.getOr(1, -1);
// Logs 2
console.log(value);

const value2 = collection.getOr(5, -1);
// Logs -1
console.log(value2);
