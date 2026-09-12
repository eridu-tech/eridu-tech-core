import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4])
    .when(true, (c) => c.append([-3]))
    .when(false, (c) => c.append([20]))
    .toArray();
// [1, 2, 3, 4, -3]
