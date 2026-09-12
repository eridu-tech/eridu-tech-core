import { ListCollection } from "eridu-tech/collection";

const original = new ListCollection([1, 2, 3]);
const modified = original.map((item) => item * 2);

// Logs [1, 2, 3]
console.log(original.toArray());

// Logs [2, 4, 6]
console.log(modified.toArray());
