import { SecretSerdeTransformer, secret } from "eridu-tech/secret";
import type { ISecret } from "eridu-tech/secret/contracts";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();
serde.registerCustom(new SecretSerdeTransformer<string>());

const apiKey = secret("example-api-key");
const serialized = serde.serialize(apiKey);
const restored = serde.deserialize<ISecret<string>>(serialized);

console.log(restored.get() === apiKey.get()); // true
