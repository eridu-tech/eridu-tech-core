import { ListCollection } from "eridu-tech/collection";

const collectionA = new ListCollection([1, 2, 3, 4]);
const collectionB = collectionA.copy();

// Logs false
console.log(collectionA === collectionB);

// Logs false
console.log(collectionA.toArray() === collectionB.toArray());
