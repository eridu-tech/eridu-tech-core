import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).shuffle().toArray();
// Random order, e.g., [3, 1, 4, 2]
