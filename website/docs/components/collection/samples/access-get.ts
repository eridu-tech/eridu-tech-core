import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 2, 3]);

const value = collection.get(1);

// Logs 2
console.log(value);
