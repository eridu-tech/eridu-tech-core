import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5, 6])
    .tap((c) => c.filter((v) => v % 2 === 0).forEach(console.log))
    .toArray();
// [1, 2, 3, 4, 5, 6] (logs 2, 4, 6)
