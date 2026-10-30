import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5])
    .change(
        (item) => item % 2 === 0,
        (item) => item * 2,
    )
    .toArray();
// [1, 4, 3, 8, 5]
