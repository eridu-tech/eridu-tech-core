import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5]).prepend([-1, 20]).toArray();
// [-1, 20, 1, 2, 3, 4, 5]
