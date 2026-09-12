import { ListCollection } from "eridu-tech/collection";

type Phone = { name: string; brand: string; type: string };

new ListCollection([
    { name: "iPhone 6", brand: "Apple", type: "phone" },
    { name: "iPhone 5", brand: "Apple", type: "phone" },
    { name: "Apple Watch", brand: "Apple", type: "watch" },
    { name: "Galaxy S6", brand: "Samsung", type: "phone" },
    { name: "Galaxy Gear", brand: "Samsung", type: "watch" },
])
    .unique((item) => item.brand)
    .toArray();
// [
//   { name: "iPhone 6", brand: "Apple", type: "phone" },
//   { name: "Galaxy S6", brand: "Samsung", type: "phone" },
// ]
