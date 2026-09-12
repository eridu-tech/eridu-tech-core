import { ListCollection } from "eridu-tech/collection";

const fromSet = new ListCollection(new Set([1, 2, 2, 4]));
// Logs [1, 2, 4]
console.log(fromSet.toArray());
