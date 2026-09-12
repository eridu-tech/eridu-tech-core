import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 4, 2, 8, -2]);
collection.getOrFail(2); // 2
collection.getOrFail(5); // throws error
