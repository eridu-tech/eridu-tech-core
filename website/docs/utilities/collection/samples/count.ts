import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5, 6]).count((value) => value % 2 === 0);
// 3
