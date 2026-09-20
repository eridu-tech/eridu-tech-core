import { ListCollection } from "eridu-tech/collection";

new ListCollection([
    { name: "iPhone 6", brand: "Apple", type: "phone" },
    { name: "iPhone 5", brand: "Apple", type: "phone" },
    { name: "Apple Watch", brand: "Apple", type: "watch" },
    { name: "Galaxy S6", brand: "Samsung", type: "phone" },
    { name: "Galaxy Gear", brand: "Samsung", type: "watch" },
])
    .difference(
        [{ name: "Apple Watch", brand: "Apple", type: "watch" }],
        // equality check occurs on product.type
        (product) => product.type,
    )
    .toArray();
// [
//   { name: "iPhone 6", brand: "Apple", type: "phone" },
//   { name: "iPhone 5", brand: "Apple", type: "phone" },
//   { name: "Galaxy S6", brand: "Samsung", type: "phone" },
// ]
