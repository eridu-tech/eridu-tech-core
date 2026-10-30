import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5]).append([-1, -2]).toArray();
// [1, 2, 3, 4, 5, -1, -2]
