import { ListCollection } from "eridu-tech/collection";

const isAllNumberLessThan6 = new ListCollection([0, 1, 2, 3, 4, 5]).every(
    (item) => item < 6,
);
// true
