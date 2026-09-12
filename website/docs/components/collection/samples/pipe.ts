import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, "2", "a", 1, 3, {}])
    .pipe((c) => c.map((item) => Number(item)).reject(isNaN))
    .pipe((c) => c.repeat(2).toArray());
// [1, 2, 1, 3]
