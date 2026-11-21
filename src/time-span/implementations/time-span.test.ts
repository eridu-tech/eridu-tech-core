import { describe, expect, test } from "vitest";

import { TO_MILLISECONDS } from "@/time-span/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

describe(
    "class: TimeSpan",
    { tags: ["Memory", "Implementations", "TimeSpan"] },
    () => {
        describe("static method: fromMilliseconds", () => {
            test("Should create a time span from milliseconds", () => {
                expect(TimeSpan.fromMilliseconds(1500).toMilliseconds()).toBe(
                    1500,
                );
            });

            test("Should create an empty time span when given zero", () => {
                expect(TimeSpan.fromMilliseconds(0).toMilliseconds()).toBe(0);
            });
        });

        describe("static method: fromSeconds", () => {
            test("Should convert seconds to milliseconds", () => {
                expect(TimeSpan.fromSeconds(30).toMilliseconds()).toBe(30_000);
            });
        });

        describe("static method: fromMinutes", () => {
            test("Should convert minutes to milliseconds", () => {
                expect(TimeSpan.fromMinutes(2).toMilliseconds()).toBe(120_000);
            });
        });

        describe("static method: fromHours", () => {
            test("Should convert hours to milliseconds", () => {
                expect(TimeSpan.fromHours(2).toMilliseconds()).toBe(7_200_000);
            });
        });

        describe("static method: fromDays", () => {
            test("Should convert days to milliseconds", () => {
                expect(TimeSpan.fromDays(2).toMilliseconds()).toBe(172_800_000);
            });
        });

        describe("static method: fromTimeSpan", () => {
            test("Should create a time span from any ITimeSpan", () => {
                const timeSpan = TimeSpan.fromTimeSpan({
                    [TO_MILLISECONDS]: () => 500,
                });

                expect(timeSpan.toMilliseconds()).toBe(500);
            });
        });

        describe("static method: fromDateRange", () => {
            test("Should use the difference between end and start", () => {
                const timeSpan = TimeSpan.fromDateRange({
                    start: new Date("2024-01-01T00:00:00.000Z"),
                    end: new Date("2024-01-01T00:00:10.000Z"),
                });

                expect(timeSpan.toMilliseconds()).toBe(10_000);
            });

            test("Should clamp to zero when end is before start", () => {
                const timeSpan = TimeSpan.fromDateRange({
                    start: new Date("2024-01-01T00:00:10.000Z"),
                    end: new Date("2024-01-01T00:00:00.000Z"),
                });

                expect(timeSpan.toMilliseconds()).toBe(0);
            });
        });

        describe("static method: fromStr", () => {
            test.each([
                ["100", 100],
                ["1s", 1_000],
                ["1.5h", 5_400_000],
                ["2 minutes", 120_000],
                ["3 days", 259_200_000],
            ])("Should parse %s as %d milliseconds", (input, expected) => {
                expect(TimeSpan.fromStr(input).toMilliseconds()).toBe(expected);
            });

            test("Should throw UnexpectedError when given an invalid string", () => {
                expect(() => {
                    TimeSpan.fromStr("not-a-duration");
                }).toThrow(UnexpectedError);
            });
        });

        test("Should clamp negative values to zero", () => {
            expect(TimeSpan.fromMilliseconds(-1).toMilliseconds()).toBe(0);
            expect(TimeSpan.fromSeconds(-1).toMilliseconds()).toBe(0);
            expect(TimeSpan.fromDays(-1).toMilliseconds()).toBe(0);
        });

        describe("method: addMilliseconds", () => {
            test("Should increase the duration", () => {
                expect(
                    TimeSpan.fromMilliseconds(100)
                        .addMilliseconds(50)
                        .toMilliseconds(),
                ).toBe(150);
            });
        });

        describe("method: addSeconds", () => {
            test("Should increase the duration by seconds", () => {
                expect(
                    TimeSpan.fromSeconds(1).addSeconds(2).toMilliseconds(),
                ).toBe(3_000);
            });
        });

        describe("method: addMinutes", () => {
            test("Should increase the duration by minutes", () => {
                expect(
                    TimeSpan.fromMinutes(1).addMinutes(2).toMilliseconds(),
                ).toBe(180_000);
            });
        });

        describe("method: addHours", () => {
            test("Should increase the duration by hours", () => {
                expect(TimeSpan.fromHours(1).addHours(2).toMilliseconds()).toBe(
                    10_800_000,
                );
            });
        });

        describe("method: addDays", () => {
            test("Should increase the duration by days", () => {
                expect(TimeSpan.fromDays(1).addDays(2).toMilliseconds()).toBe(
                    259_200_000,
                );
            });
        });

        describe("method: addTimeSpan", () => {
            test("Should increase the duration by an ITimeSpan", () => {
                const timeSpan = TimeSpan.fromSeconds(1).addTimeSpan({
                    [TO_MILLISECONDS]: () => 500,
                });

                expect(timeSpan.toMilliseconds()).toBe(1_500);
            });
        });

        describe("method: subtractMilliseconds", () => {
            test("Should decrease the duration", () => {
                expect(
                    TimeSpan.fromMilliseconds(100)
                        .subtractMilliseconds(50)
                        .toMilliseconds(),
                ).toBe(50);
            });

            test("Should clamp to zero when the result is negative", () => {
                expect(
                    TimeSpan.fromMilliseconds(100)
                        .subtractMilliseconds(150)
                        .toMilliseconds(),
                ).toBe(0);
            });
        });

        describe("method: subtractSeconds", () => {
            test("Should decrease the duration by seconds", () => {
                expect(
                    TimeSpan.fromSeconds(3).subtractSeconds(2).toMilliseconds(),
                ).toBe(1_000);
            });
        });

        describe("method: subtractMinutes", () => {
            test("Should decrease the duration by minutes", () => {
                expect(
                    TimeSpan.fromMinutes(3).subtractMinutes(2).toMilliseconds(),
                ).toBe(60_000);
            });
        });

        describe("method: subtractHours", () => {
            test("Should decrease the duration by hours", () => {
                expect(
                    TimeSpan.fromHours(3).subtractHours(2).toMilliseconds(),
                ).toBe(3_600_000);
            });
        });

        describe("method: subtractDays", () => {
            test("Should decrease the duration by days", () => {
                expect(
                    TimeSpan.fromDays(3).subtractDays(2).toMilliseconds(),
                ).toBe(86_400_000);
            });
        });

        describe("method: subtractTimeSpan", () => {
            test("Should decrease the duration by an ITimeSpan", () => {
                const timeSpan = TimeSpan.fromSeconds(1).subtractTimeSpan({
                    [TO_MILLISECONDS]: () => 500,
                });

                expect(timeSpan.toMilliseconds()).toBe(500);
            });
        });

        describe("method: multiply", () => {
            test("Should multiply the duration", () => {
                expect(
                    TimeSpan.fromSeconds(2).multiply(2.5).toMilliseconds(),
                ).toBe(5_000);
            });

            test("Should round the resulting duration", () => {
                expect(
                    TimeSpan.fromMilliseconds(101)
                        .multiply(0.5)
                        .toMilliseconds(),
                ).toBe(51);
            });
        });

        describe("method: divide", () => {
            test("Should divide the duration", () => {
                expect(TimeSpan.fromSeconds(3).divide(2).toMilliseconds()).toBe(
                    1_500,
                );
            });

            test("Should round the resulting duration", () => {
                expect(
                    TimeSpan.fromMilliseconds(101).divide(2).toMilliseconds(),
                ).toBe(51);
            });
        });

        describe("method: toMilliseconds", () => {
            test("Should return the total duration in milliseconds", () => {
                expect(TimeSpan.fromSeconds(90).toMilliseconds()).toBe(90_000);
            });
        });

        describe("method: toSeconds", () => {
            test("Should floor the duration to whole seconds", () => {
                expect(TimeSpan.fromMilliseconds(1_999).toSeconds()).toBe(1);
            });
        });

        describe("method: toMinutes", () => {
            test("Should floor the duration to whole minutes", () => {
                expect(TimeSpan.fromSeconds(119).toMinutes()).toBe(1);
            });
        });

        describe("method: toHours", () => {
            test("Should floor the duration to whole hours", () => {
                expect(TimeSpan.fromMinutes(119).toHours()).toBe(1);
            });
        });

        describe("method: toDays", () => {
            test("Should floor the duration to whole days", () => {
                expect(TimeSpan.fromHours(47).toDays()).toBe(1);
            });
        });

        describe("method: toString", () => {
            test.each([
                [0, "0ms"],
                [999, "999ms"],
                [1_000, "1s"],
                [60_000, "1m"],
                [3_600_000, "1h"],
                [86_400_000, "1d"],
            ])(
                "Should format %d milliseconds as %s",
                (milliseconds, expected) => {
                    expect(
                        TimeSpan.fromMilliseconds(milliseconds).toString(),
                    ).toBe(expected);
                },
            );
        });

        describe("method: toEndDate", () => {
            test("Should add the duration to the given start date", () => {
                const startDate = new Date("2024-01-01T00:00:00.000Z");

                expect(
                    TimeSpan.fromSeconds(10).toEndDate(startDate).toISOString(),
                ).toBe("2024-01-01T00:00:10.000Z");
            });
        });

        describe("method: toStartDate", () => {
            test("Should subtract the duration from the given end date", () => {
                const endDate = new Date("2024-01-01T00:00:10.000Z");

                expect(
                    TimeSpan.fromSeconds(10).toStartDate(endDate).toISOString(),
                ).toBe("2024-01-01T00:00:00.000Z");
            });
        });

        describe("method: equals", () => {
            test("Should return true when given an equal time span", () => {
                expect(
                    TimeSpan.fromSeconds(1).equals(TimeSpan.fromSeconds(1)),
                ).toBe(true);
            });

            test("Should return false when given a different time span", () => {
                expect(
                    TimeSpan.fromSeconds(1).equals(TimeSpan.fromSeconds(2)),
                ).toBe(false);
            });

            test("Should compare against any ITimeSpan", () => {
                expect(
                    TimeSpan.fromMilliseconds(500).equals({
                        [TO_MILLISECONDS]: () => 500,
                    }),
                ).toBe(true);
            });
        });

        describe("method: gt", () => {
            test("Should return true when greater than the given time span", () => {
                expect(
                    TimeSpan.fromSeconds(2).gt(TimeSpan.fromSeconds(1)),
                ).toBe(true);
                expect(
                    TimeSpan.fromSeconds(1).gt(TimeSpan.fromSeconds(1)),
                ).toBe(false);
            });
        });

        describe("method: gte", () => {
            test("Should return true when greater than or equal to the given time span", () => {
                expect(
                    TimeSpan.fromSeconds(2).gte(TimeSpan.fromSeconds(1)),
                ).toBe(true);
                expect(
                    TimeSpan.fromSeconds(1).gte(TimeSpan.fromSeconds(1)),
                ).toBe(true);
                expect(
                    TimeSpan.fromSeconds(1).gte(TimeSpan.fromSeconds(2)),
                ).toBe(false);
            });
        });

        describe("method: lt", () => {
            test("Should return true when less than the given time span", () => {
                expect(
                    TimeSpan.fromSeconds(1).lt(TimeSpan.fromSeconds(2)),
                ).toBe(true);
                expect(
                    TimeSpan.fromSeconds(1).lt(TimeSpan.fromSeconds(1)),
                ).toBe(false);
            });
        });

        describe("method: lte", () => {
            test("Should return true when less than or equal to the given time span", () => {
                expect(
                    TimeSpan.fromSeconds(1).lte(TimeSpan.fromSeconds(2)),
                ).toBe(true);
                expect(
                    TimeSpan.fromSeconds(1).lte(TimeSpan.fromSeconds(1)),
                ).toBe(true);
                expect(
                    TimeSpan.fromSeconds(2).lte(TimeSpan.fromSeconds(1)),
                ).toBe(false);
            });
        });

        test("Should expose the duration through TO_MILLISECONDS", () => {
            expect(TimeSpan.fromSeconds(3)[TO_MILLISECONDS]()).toBe(3_000);
        });

        describe("static property: serdeTransformer", () => {
            test("isApplicable Should return true for TimeSpan instances", () => {
                expect(
                    TimeSpan.serdeTransformer.isApplicable(
                        TimeSpan.fromSeconds(1),
                    ),
                ).toBe(true);
            });

            test("isApplicable Should return false for non-TimeSpan values", () => {
                expect(TimeSpan.serdeTransformer.isApplicable(1_000)).toBe(
                    false,
                );
                expect(TimeSpan.serdeTransformer.isApplicable("1s")).toBe(
                    false,
                );
            });

            test("serialize Should return the version and time in milliseconds", () => {
                expect(
                    TimeSpan.serdeTransformer.serialize(
                        TimeSpan.fromSeconds(2),
                    ),
                ).toStrictEqual({
                    version: "1",
                    timeInMs: 2_000,
                });
            });

            test("deserialize Should recreate the time span", () => {
                const timeSpan = TimeSpan.serdeTransformer.deserialize({
                    version: "1",
                    timeInMs: 2_000,
                });

                expect(timeSpan).toBeInstanceOf(TimeSpan);
                expect(timeSpan.toMilliseconds()).toBe(2_000);
            });
        });
    },
);
