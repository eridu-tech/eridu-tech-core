import { ListCollection } from "eridu-tech/collection";

const iterator = new ListCollection([1, 2, 3, 4, 5]).toIterator();

console.log("item 1:", iterator.next());
console.log("item 2:", iterator.next());
console.log("item 3:", iterator.next());
console.log("done:", iterator.next());
