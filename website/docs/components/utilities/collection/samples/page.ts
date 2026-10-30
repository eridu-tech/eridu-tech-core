import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5, 6, 7, 8, 9])
    .page(
        2, // Page number
        3, // Page size
    )
    .toArray();
// [4, 5, 6]
