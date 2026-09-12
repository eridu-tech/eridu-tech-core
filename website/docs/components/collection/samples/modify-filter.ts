import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 2, 3, 4, 5, 6]).filter(
    (value) => value % 2 === 0,
);

// Logs [2, 4, 5]
console.log(collection.toArray());
