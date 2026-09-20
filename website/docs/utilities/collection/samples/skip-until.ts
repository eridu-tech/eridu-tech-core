import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).skipUntil((item) => item >= 3).toArray();
// [3, 4]
