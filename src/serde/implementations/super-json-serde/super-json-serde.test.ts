import { describe, expect, test } from "vitest";

import {
    UnableToDeserializeSerdeError,
    UnableToSerializeSerdeError,
} from "@/serde/contracts/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";

import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";

class Money {
    constructor(readonly amountInCents: number) {}
}

type SerializedMoney = {
    version: "1";
    amountInCents: number;
};

const moneyTransformer: ISerdeTransformer<Money, SerializedMoney> = {
    name: "money",
    isApplicable: (value): value is Money => {
        return value instanceof Money;
    },
    serialize: (value) => {
        return { version: "1", amountInCents: value.amountInCents };
    },
    deserialize: (serialized) => {
        return new Money(serialized.amountInCents);
    },
};

describe(
    "class: SuperJsonSerde",
    { tags: ["Memory", "Implementations", "Serde"] },
    () => {
        describe("method: serialize", () => {
            test("Should serialize plain objects to a string", () => {
                const serde = new SuperJsonSerde();

                const serialized = serde.serialize({ a: 1, b: "two" });

                expect(typeof serialized).toBe("string");
                expect(serde.deserialize(serialized)).toStrictEqual({
                    a: 1,
                    b: "two",
                });
            });

            test("Should preserve Date instances", () => {
                const serde = new SuperJsonSerde();
                const date = new Date("2024-01-01T00:00:00.000Z");

                const deserialized = serde.deserialize<Date>(
                    serde.serialize(date),
                );

                expect(deserialized).toBeInstanceOf(Date);
                expect(deserialized.toISOString()).toBe(date.toISOString());
            });

            test("Should throw UnableToSerializeSerdeError when the value cannot be serialized", () => {
                const serde = new SuperJsonSerde();
                const value = {
                    toJSON: () => {
                        throw new Error("boom");
                    },
                };

                expect(() => {
                    serde.serialize(value);
                }).toThrow(UnableToSerializeSerdeError);
            });
        });

        describe("method: deserialize", () => {
            test("Should throw UnableToDeserializeSerdeError when given an invalid string", () => {
                const serde = new SuperJsonSerde();

                expect(() => {
                    serde.deserialize("{invalid");
                }).toThrow(UnableToDeserializeSerdeError);
            });
        });

        describe("method: registerCustom", () => {
            test("Should return itself to allow chaining", () => {
                const serde = new SuperJsonSerde();

                expect(serde.registerCustom(moneyTransformer)).toBe(serde);
            });

            test("Should serialize and deserialize values handled by the transformer", () => {
                const serde = new SuperJsonSerde().registerCustom(
                    moneyTransformer,
                );

                const deserialized = serde.deserialize<Money>(
                    serde.serialize(new Money(500)),
                );

                expect(deserialized).toBeInstanceOf(Money);
                expect(deserialized.amountInCents).toBe(500);
            });

            test("Should not register the same transformer twice", () => {
                const serde = new SuperJsonSerde();
                serde.registerCustom(moneyTransformer);
                serde.registerCustom(moneyTransformer);

                const deserialized = serde.deserialize<Money>(
                    serde.serialize(new Money(500)),
                );

                expect(deserialized.amountInCents).toBe(500);
            });

            test("Should support transformers with multiple names", () => {
                const serde = new SuperJsonSerde().registerCustom({
                    ...moneyTransformer,
                    name: ["money", "currency"],
                });

                const deserialized = serde.deserialize<Money>(
                    serde.serialize(new Money(500)),
                );

                expect(deserialized).toBeInstanceOf(Money);
                expect(deserialized.amountInCents).toBe(500);
            });
        });
    },
);
