import { ListCollection } from "eridu-tech/collection";

ListCollection.difference([1, 2, 2, 3, 4, 5], [2, 4, 6, 8]).toArray();
// [1, 3, 5]
