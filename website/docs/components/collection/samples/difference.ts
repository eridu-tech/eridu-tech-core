import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 2, 3, 4, 5]).difference([2, 4, 6, 8]).toArray();
// [1, 3, 5]
