import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).beforeOr(-1, (item) => item === 2);
// 1
