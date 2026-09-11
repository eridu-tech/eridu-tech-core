import type { ISerdeTransformer } from "eridu-tech/serde/contracts";
import { serde } from "./serde_initial_config.js";

type ISerializedUser = {
    version: "1";
    name: string;
    age: number;
};

class User {
    static readonly serdeTransformer: ISerdeTransformer<User, ISerializedUser> =
        {
            name: "User",
            isApplicable(value: unknown): value is User {
                return value instanceof User;
            },
            deserialize(serializedValue: ISerializedUser): User {
                return new User(serializedValue.name, serializedValue.age);
            },
            serialize(deserializedValue: User): ISerializedUser {
                return {
                    version: "1",
                    name: deserializedValue.name,
                    age: deserializedValue.age,
                };
            },
        };
        
    constructor(
        readonly name: string,
        readonly age: number,
    ) {}
}

serde.registerCustom(User.serdeTransformer);
