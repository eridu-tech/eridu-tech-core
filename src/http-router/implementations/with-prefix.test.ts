/**
 * @module HttpRouter
 */

import { describe, expect, test } from "vitest";

import { withPrefix } from "@/http-router/implementations/with-prefix.js";

describe("function: withPrefix", () => {
    describe("When every path is made only of slashes:", () => {
        test("Should resolve to the root path", () => {
            expect(withPrefix("///", "///")).toBe("/");
            expect(withPrefix("//", "//")).toBe("/");
            expect(withPrefix("/", "/")).toBe("/");
        });
    });
    describe("When paths are wrapped in three slashes:", () => {
        test("Should trim the leading slashes of the prefix and the sub-path", () => {
            expect(withPrefix("///a", "///b")).toBe("/a/b");
        });
        test("Should trim the trailing slashes of the prefix and the sub-path", () => {
            expect(withPrefix("a///", "b///")).toBe("/a/b");
        });
        test("Should trim the trailing slashes of the prefix and the leading slashes of the sub-path", () => {
            expect(withPrefix("a///", "///b")).toBe("/a/b");
        });
        test("Should trim the leading slashes of the prefix and the trailing slashes of the sub-path", () => {
            expect(withPrefix("///a", "b///")).toBe("/a/b");
        });
    });
    describe("When paths are wrapped in two slashes:", () => {
        test("Should trim the leading slashes of the prefix and the sub-path", () => {
            expect(withPrefix("//a", "//b")).toBe("/a/b");
        });
        test("Should trim the trailing slashes of the prefix and the sub-path", () => {
            expect(withPrefix("a//", "b//")).toBe("/a/b");
        });
        test("Should trim the trailing slashes of the prefix and the leading slashes of the sub-path", () => {
            expect(withPrefix("a//", "//b")).toBe("/a/b");
        });
        test("Should trim the leading slashes of the prefix and the trailing slashes of the sub-path", () => {
            expect(withPrefix("//a", "b//")).toBe("/a/b");
        });
    });
    describe("When paths are wrapped in one slash:", () => {
        test("Should trim the leading slashes of the prefix and the sub-path", () => {
            expect(withPrefix("/a", "/b")).toBe("/a/b");
        });
        test("Should trim the trailing slashes of the prefix and the sub-path", () => {
            expect(withPrefix("a/", "b/")).toBe("/a/b");
        });
        test("Should trim the trailing slashes of the prefix and the leading slashes of the sub-path", () => {
            expect(withPrefix("a/", "/b")).toBe("/a/b");
        });
        test("Should trim the leading slashes of the prefix and the trailing slashes of the sub-path", () => {
            expect(withPrefix("/a", "b/")).toBe("/a/b");
        });
    });
    describe("When more than two paths are given:", () => {
        test("Should trim the leading slashes of the prefix and the sub-paths", () => {
            expect(withPrefix("//a", "//b", "//c")).toBe("/a/b/c");
        });
        test("Should trim the trailing slashes of the prefix and the sub-paths", () => {
            expect(withPrefix("a//", "b//", "c//")).toBe("/a/b/c");
        });
        test("Should trim the trailing slashes of the prefix and the leading slashes of the sub-paths", () => {
            expect(withPrefix("a//", "//b", "//c")).toBe("/a/b/c");
        });
        test("Should trim the leading slashes of the prefix and the trailing slashes of the sub-paths", () => {
            expect(withPrefix("//a", "b//", "c//")).toBe("/a/b/c");
        });
        test("Should resolve the same when the paths are joined in multiple calls", () => {
            expect(withPrefix(withPrefix("//a", "//b"), "//c")).toBe("/a/b/c");
        });
    });
    describe("When the sub-path is empty:", () => {
        test("Should resolve to the prefix alone", () => {
            expect(withPrefix("/users/", "")).toBe("/users");
            expect(withPrefix("//users//", "")).toBe("/users");
        });
        test("Should resolve to the root path when the prefix is made only of slashes", () => {
            expect(withPrefix("/", "")).toBe("/");
            expect(withPrefix("", "")).toBe("/");
        });
    });
});
