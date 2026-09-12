import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).takeUntil((item) => item >= 3).toArray();
// [1, 2]
