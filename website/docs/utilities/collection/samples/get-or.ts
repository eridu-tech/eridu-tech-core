import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 4, 2, 8, -2]);
collection.getOr(2, -1); // 2
collection.getOr(5, -1); // -1
