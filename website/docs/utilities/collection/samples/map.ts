import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5]).map((item) => item * 2).toArray();
// [2, 4, 6, 8, 10]
