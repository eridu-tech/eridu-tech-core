import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).map((item) => item.toString()).join("_");
// "1_2_3_4"
