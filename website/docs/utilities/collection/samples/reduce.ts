import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3]).reduce((sum, item) => sum + item);
// 6
