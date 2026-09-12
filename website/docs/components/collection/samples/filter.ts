import { ListCollection } from "eridu-tech/collection";

new ListCollection([0, 1, 2, 3, 4, 5, 6])
    .filter((item) => 2 < item && item < 5)
    .toArray();
// [3, 4]
