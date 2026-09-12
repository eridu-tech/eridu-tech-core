import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5])
    .sliding(2)
    .map((chunk) => chunk.toArray())
    .toArray();
// [[1, 2], [2, 3], [3, 4], [4, 5]]
