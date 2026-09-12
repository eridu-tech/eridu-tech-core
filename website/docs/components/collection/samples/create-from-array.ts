import { ListCollection } from "eridu-tech/collection";

const fromArray = new ListCollection([1, 2, 3, 4]);

// Logs [1, 2, 3, 4]
console.log(fromArray.toArray());
