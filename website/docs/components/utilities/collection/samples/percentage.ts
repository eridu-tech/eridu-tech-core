import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 1, 2, 2, 2, 3]).percentage((value) => value === 1);
// 33.333
