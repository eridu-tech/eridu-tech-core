import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).takeWhile((item) => item < 4).toArray();
// [1, 2, 3]
