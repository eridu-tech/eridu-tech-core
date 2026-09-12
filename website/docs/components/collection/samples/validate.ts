import { ListCollection } from "eridu-tech/collection";
import { z } from "zod";

new ListCollection(["a", "1.2", "3", "null"])
    .validate(z.string().pipe(z.coerce.number()))
    .toArray();
// [1.2, 3]
