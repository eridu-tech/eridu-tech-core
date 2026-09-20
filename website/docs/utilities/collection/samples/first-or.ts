import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).firstOr(-1, (item) => item > 10);
// -1
