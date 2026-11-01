import { ListCollection } from "eridu-tech/collection";

new ListCollection([0, 1, 2, 3, 4, 5]).take(-2).toArray();
// [0, 1, 2, 3]
