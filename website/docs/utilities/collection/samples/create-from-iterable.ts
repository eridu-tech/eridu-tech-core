import { ListCollection } from "eridu-tech/collection";

class MyIterable implements Iterable<number> {
    *[Symbol.iterator](): Iterator<number> {
        yield 1;
        yield 2;
        yield 3;
    }
}

const fromIterable: ListCollection<number> = new ListCollection(
    new MyIterable(),
);
// Logs [1, 2, 3]
console.log(fromIterable.toArray());
