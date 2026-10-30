import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 4, 2, 8, -2]);
collection.get(2); // 2
collection.get(5); // null
