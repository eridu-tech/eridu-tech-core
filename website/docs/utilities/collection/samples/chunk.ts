import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5, 6, 7])
    .chunk(4)
    .map((chunk) => chunk.toArray())
    .toArray();
// [[1, 2, 3, 4], [5, 6, 7]]
