import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 1, 2, 2, 3, 4, 2]).unique().toArray();
// [1, 2, 3, 4]
