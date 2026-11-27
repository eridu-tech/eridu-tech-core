/**
 * @module EventBus
 */

import { describe, vi } from "vitest";

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { TestAPI, SuiteAPI, ExpectStatic, beforeEach } from "vitest";

import type {
    BaseEvent,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/test-utilities"`
 * @group TestUtilities
 */
export type EventBusAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IEventBusAdapter>;
    /**
     * Skips the tests that check events dispatched before a listener is added
     * are not delivered.
     *
     * Enable it when the adapter cannot tell what was dispatched before a
     * listener subscribed.
     *
     * @default false
     */
    excludePreSubscriptionTests?: boolean;
};

/**
 * The `eventBusAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IEventBusAdapter | `IEventBusAdapter`} with vitest.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/test-utilities"`
 * @group TestUtilities
 */
export function eventBusAdapterTestSuite(
    settings: EventBusAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        beforeEach: beforeEach_,
        excludePreSubscriptionTests: skipPreSubscriptionTests = false,
    } = settings;

    let adapter: IEventBusAdapter;

    const dispatchDelay = TimeSpan.fromMilliseconds(20);

    describe("IEventBusAdapter tests:", () => {
        beforeEach_(async () => {
            adapter = await createAdapter();
        });
        describe("method: addListener, removeListener, dispatch", () => {
            test("Should be null when listener added and event is not triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", handlerFn);

                await delay(dispatchDelay);
                expect(handlerFn).not.toHaveBeenCalled();
            });
            test("Should be TestEvent when listener added and event is triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                await adapter.addListener("event", handlerFn);

                const event = {
                    type: "event",
                };
                await adapter.dispatch("event", event);
                await delay(dispatchDelay);

                expect(handlerFn).toHaveBeenCalledTimes(1);
                expect(handlerFn).toHaveBeenCalledWith(event);
            });
            test("Should be null when listener removed and event is triggered", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", handlerFn);
                await adapter.removeListener("event", handlerFn);
                const event = {
                    type: "event",
                };

                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(handlerFn).not.toHaveBeenCalled();
            });
            test("Should call the remaining listener when one of multiple listeners is removed", async () => {
                const firstHandlerFn = vi.fn((_event: BaseEvent) => {});
                const secondHandlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", firstHandlerFn);
                await adapter.addListener("event", secondHandlerFn);
                await adapter.removeListener("event", firstHandlerFn);
                const event = {
                    type: "event",
                };

                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(firstHandlerFn).not.toHaveBeenCalled();
                expect(secondHandlerFn).toHaveBeenCalledTimes(1);
                expect(secondHandlerFn).toHaveBeenCalledWith(event);
            });
        });

        describe("multiple listeners:", () => {
            test("Should call both listeners once when two listeners are added for the same event", async () => {
                const firstHandlerFn = vi.fn((_event: BaseEvent) => {});
                const secondHandlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("event", firstHandlerFn);
                await adapter.addListener("event", secondHandlerFn);
                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(firstHandlerFn).toHaveBeenCalledTimes(1);
                expect(firstHandlerFn).toHaveBeenCalledWith(event);
                expect(secondHandlerFn).toHaveBeenCalledTimes(1);
                expect(secondHandlerFn).toHaveBeenCalledWith(event);
            });
            test("Should invoke a listener once per addListener call when the same listener is added twice", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("event", handlerFn);
                await adapter.addListener("event", handlerFn);
                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(2);
            });
            test("Should keep a shared listener registered for another event when removed from one event", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const eventB = {
                    type: "eventB",
                };

                await adapter.addListener("eventA", handlerFn);
                await adapter.addListener("eventB", handlerFn);
                await adapter.removeListener("eventA", handlerFn);
                await adapter.dispatch("eventB", eventB);

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(1);
                expect(handlerFn).toHaveBeenCalledWith(eventB);
            });
            test("Should call a listener again after it is removed and re-added", async () => {
                const firstHandlerFn = vi.fn((_event: BaseEvent) => {});
                const secondHandlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("event", firstHandlerFn);
                await adapter.addListener("event", secondHandlerFn);
                await adapter.removeListener("event", firstHandlerFn);
                await adapter.addListener("event", firstHandlerFn);
                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(firstHandlerFn).toHaveBeenCalledTimes(1);
                expect(secondHandlerFn).toHaveBeenCalledTimes(1);
            });
            test("Should deliver events to a new listener after all previous listeners were removed", async () => {
                const firstHandlerFn = vi.fn((_event: BaseEvent) => {});
                const secondHandlerFn = vi.fn((_event: BaseEvent) => {});
                const thirdHandlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("event", firstHandlerFn);
                await adapter.addListener("event", secondHandlerFn);
                await adapter.removeListener("event", firstHandlerFn);
                await adapter.removeListener("event", secondHandlerFn);
                await adapter.addListener("event", thirdHandlerFn);
                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(firstHandlerFn).not.toHaveBeenCalled();
                expect(secondHandlerFn).not.toHaveBeenCalled();
                expect(thirdHandlerFn).toHaveBeenCalledTimes(1);
            });
            test("Should not throw when the last listener is removed twice", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("event", handlerFn);
                await adapter.removeListener("event", handlerFn);

                await expect(
                    adapter.removeListener("event", handlerFn),
                ).resolves.toBeUndefined();
            });
            test("Should not throw when removing a listener that was never added", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await expect(
                    adapter.removeListener("event", handlerFn),
                ).resolves.toBeUndefined();
            });
            test("Should call every listener when more than ten listeners are added for the same event", async () => {
                const handlerFns = Array.from({ length: 11 }, () =>
                    vi.fn((_event: BaseEvent) => {}),
                );
                const event = {
                    type: "event",
                };

                for (const handlerFn of handlerFns) {
                    await adapter.addListener("event", handlerFn);
                }
                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                for (const handlerFn of handlerFns) {
                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith(event);
                }
            });
        });

        describe("event isolation:", () => {
            test("Should not call a listener when a different event is dispatched", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});

                await adapter.addListener("eventA", handlerFn);
                await adapter.dispatch("eventB", { type: "eventB" });

                await delay(dispatchDelay);
                expect(handlerFn).not.toHaveBeenCalled();
            });
            test("Should keep delivering another event after a listener is removed from one event", async () => {
                const firstHandlerFn = vi.fn((_event: BaseEvent) => {});
                const secondHandlerFn = vi.fn((_event: BaseEvent) => {});
                const eventB = {
                    type: "eventB",
                };

                await adapter.addListener("eventA", firstHandlerFn);
                await adapter.addListener("eventB", secondHandlerFn);
                await adapter.removeListener("eventA", firstHandlerFn);
                await adapter.dispatch("eventB", eventB);

                await delay(dispatchDelay);
                expect(firstHandlerFn).not.toHaveBeenCalled();
                expect(secondHandlerFn).toHaveBeenCalledTimes(1);
                expect(secondHandlerFn).toHaveBeenCalledWith(eventB);
            });
            test("Should deliver events for multiple event names on the same adapter", async () => {
                const firstHandlerFn = vi.fn((_event: BaseEvent) => {});
                const secondHandlerFn = vi.fn((_event: BaseEvent) => {});
                const eventA = {
                    type: "eventA",
                };
                const eventB = {
                    type: "eventB",
                };

                await adapter.addListener("eventA", firstHandlerFn);
                await adapter.addListener("eventB", secondHandlerFn);
                await adapter.dispatch("eventA", eventA);
                await adapter.dispatch("eventB", eventB);

                await delay(dispatchDelay);
                expect(firstHandlerFn).toHaveBeenCalledTimes(1);
                expect(firstHandlerFn).toHaveBeenCalledWith(eventA);
                expect(secondHandlerFn).toHaveBeenCalledTimes(1);
                expect(secondHandlerFn).toHaveBeenCalledWith(eventB);
            });
            test("Should support event names with special characters", async () => {
                const eventNames = [
                    "event with spaces",
                    'event"with"quotes',
                    "event.with.dots",
                    "event;semicolon",
                    "select",
                    "EVENT_UPPER",
                ];
                const handlers = eventNames.map((eventName) => ({
                    eventName,
                    handlerFn: vi.fn((_event: BaseEvent) => {}),
                }));

                for (const { eventName, handlerFn } of handlers) {
                    await adapter.addListener(eventName, handlerFn);
                }
                for (const { eventName } of handlers) {
                    await adapter.dispatch(eventName, { eventName });
                }

                await delay(dispatchDelay);
                for (const { eventName, handlerFn } of handlers) {
                    expect(handlerFn).toHaveBeenCalledTimes(1);
                    expect(handlerFn).toHaveBeenCalledWith({ eventName });
                }
            });
            test("Should support an empty event name", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("", handlerFn);
                await adapter.dispatch("", event);

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(1);
                expect(handlerFn).toHaveBeenCalledWith(event);
            });
            test("Should treat event names case-sensitively", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("Event", handlerFn);
                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(handlerFn).not.toHaveBeenCalled();

                await adapter.dispatch("Event", event);

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(1);
            });
            test("Should support event names longer than the Postgres channel name limit", async () => {
                const eventName = `event-${"x".repeat(100)}`;
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener(eventName, handlerFn);
                await adapter.dispatch(eventName, event);

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(1);
                expect(handlerFn).toHaveBeenCalledWith(event);
            });
        });

        describe("dispatch:", () => {
            test("Should resolve when dispatching an event that has no listeners", async () => {
                await expect(
                    adapter.dispatch("event", { type: "event" }),
                ).resolves.toBeUndefined();
            });
            test.skipIf(skipPreSubscriptionTests)(
                "Should not deliver events dispatched before a listener is added",
                async () => {
                    const handlerFn = vi.fn((_event: BaseEvent) => {});

                    await adapter.dispatch("event", { type: "event" });
                    await adapter.addListener("event", handlerFn);

                    await delay(dispatchDelay);
                    expect(handlerFn).not.toHaveBeenCalled();
                },
            );
            test.skipIf(skipPreSubscriptionTests)(
                "Should not deliver events dispatched before a listener is added, even when listener already exists",
                async () => {
                    const handlerFn1 = vi.fn((_event: BaseEvent) => {});
                    await adapter.dispatch("event", { type: "event" });
                    await adapter.addListener("event", handlerFn1);

                    const handlerFn2 = vi.fn((_event: BaseEvent) => {});
                    await adapter.dispatch("event", { type: "event" });
                    await adapter.addListener("event", handlerFn2);

                    await delay(dispatchDelay);
                    expect(handlerFn2).not.toHaveBeenCalled();
                },
            );
            test("Should call a listener once for each dispatch", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("event", handlerFn);
                await adapter.dispatch("event", event);
                await adapter.dispatch("event", event);

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(2);
            });
            test("Should deliver sequential events in order", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const events = [{ index: 0 }, { index: 1 }, { index: 2 }];

                await adapter.addListener("event", handlerFn);
                for (const event of events) {
                    await adapter.dispatch("event", event);
                }

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(events.length);
                expect(handlerFn.mock.calls.map(([event]) => event)).toEqual(
                    events,
                );
            });
            test("Should deliver all concurrently dispatched events", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const events = Array.from({ length: 5 }, (_, index) => ({
                    index,
                }));

                await adapter.addListener("event", handlerFn);
                await Promise.all(
                    events.map((event) => adapter.dispatch("event", event)),
                );

                await delay(dispatchDelay);
                expect(handlerFn).toHaveBeenCalledTimes(events.length);
                expect(handlerFn.mock.calls.map(([event]) => event)).toEqual(
                    expect.arrayContaining(events),
                );
            });
            test("Should deliver events again after a listener is removed and re-added", async () => {
                const handlerFn = vi.fn((_event: BaseEvent) => {});
                const event = {
                    type: "event",
                };

                await adapter.addListener("event", handlerFn);
                await adapter.dispatch("event", event);
                await delay(dispatchDelay);

                await adapter.removeListener("event", handlerFn);
                await adapter.dispatch("event", event);
                await delay(dispatchDelay);

                await adapter.addListener("event", handlerFn);
                await adapter.dispatch("event", event);
                await delay(dispatchDelay);

                expect(handlerFn).toHaveBeenCalledTimes(2);
            });
        });
    });
}
