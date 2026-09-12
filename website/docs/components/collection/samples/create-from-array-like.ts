import { ListCollection } from "eridu-tech/collection";

const myArrayLike: ArrayLike<number> = {
    0: 1,
    1: 2,
    2: -3,
    3: -1,
    length: 4,
};

const fromArrayLike: ListCollection<number> = new ListCollection(myArrayLike);
// Logs [1, 2, 3]
console.log(fromArrayLike.toArray());
