import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5]).set(1, -1).toArray();
// [1, -1, 3, 4, 5]
