import { describe, expect, test } from "vitest";

import { containsRedisClusterHashTag } from "@/utilities/functions/contains-redis-cluster-hash-tag.js";

describe(
    "function: containsRedisClusterHashTag",
    { tags: ["Utilities"] },
    () => {
        test("Should return false when the key has no braces", () => {
            expect(containsRedisClusterHashTag("lock")).toBe(false);
        });
        test("Should return true when the whole key is a hash tag", () => {
            expect(containsRedisClusterHashTag("{lock}")).toBe(true);
        });
        test("Should return true when the hash tag is followed by a suffix", () => {
            expect(containsRedisClusterHashTag("{lock}__writer")).toBe(true);
        });
        test("Should return true when the hash tag contains a brace and is followed by a suffix", () => {
            expect(containsRedisClusterHashTag("{{lock}}__writer")).toBe(true);
        });
        test("Should return true when the hash tag is preceded by a prefix", () => {
            expect(containsRedisClusterHashTag("writer__{lock}")).toBe(true);
        });
        test("Should return true when the hash tag contains a brace and is preceded by a prefix", () => {
            expect(containsRedisClusterHashTag("writer__{{lock}}")).toBe(true);
        });
        test("Should return true when the hash tag is between a prefix and a suffix", () => {
            expect(containsRedisClusterHashTag("a{lock}b")).toBe(true);
        });
        test("Should return true when the hash tag contains a brace and is between a prefix and a suffix", () => {
            expect(containsRedisClusterHashTag("a{{lock}}b")).toBe(true);
        });
        test("Should return true when the hash tag starts with a brace", () => {
            expect(containsRedisClusterHashTag("{{lock}}")).toBe(true);
        });
        test("Should return true when the hash tag is a single brace at the end of the key", () => {
            expect(containsRedisClusterHashTag("lock{{}}")).toBe(true);
        });
        test("Should return true when the hash tag is a single brace at the start of the key", () => {
            expect(containsRedisClusterHashTag("{{}}lock")).toBe(true);
        });
        test("Should return false when the hash tag is empty", () => {
            expect(containsRedisClusterHashTag("{}")).toBe(false);
        });
        test("Should return false when the empty hash tag is at the end of the key", () => {
            expect(containsRedisClusterHashTag("lock{}")).toBe(false);
        });
        test("Should return false when the empty hash tag is at the start of the key", () => {
            expect(containsRedisClusterHashTag("{}lock")).toBe(false);
        });
        test("Should return false when the hash tag is not closed", () => {
            expect(containsRedisClusterHashTag("{lock")).toBe(false);
        });
        test("Should return false when the key has no opening brace", () => {
            expect(containsRedisClusterHashTag("lock}")).toBe(false);
        });
        test("Should return false when the key is empty", () => {
            expect(containsRedisClusterHashTag("")).toBe(false);
        });
    },
);
