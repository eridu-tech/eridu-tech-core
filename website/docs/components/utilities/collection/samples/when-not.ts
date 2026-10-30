import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4])
    .whenNot(true, (c) => c.append([-3]))
    .whenNot(false, (c) => c.append([20]))
    .toArray();
// [1, 2, 3, 4, 20]
