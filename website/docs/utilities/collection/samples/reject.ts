import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5, 6])
    .reject((item) => 2 < item && item < 5)
    .toArray();
// [1, 2, 5, 6]
