import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5, 6])
    .partition((nbr) => nbr % 2 === 0)
    .map((chunk) => chunk.toArray())
    .toArray();
// [[2, 4, 6], [1, 3, 5]]
