import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 2, 3, 4, 5])
    .insertAfter((item) => item === 2, [-1, 20])
    .toArray();
// [1, 2, -1, 20, 2, 3, 4, 5]
