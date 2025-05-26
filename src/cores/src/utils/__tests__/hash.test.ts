import { describe, it, expect } from "vitest";
import {
  hashBinary,
  hashObject,
  hashBlob,
  hashTree,
  hashCommit,
  hashMetadata,
} from "../hash";

describe("Hashing Utilities", () => {
  describe("hashBinary", () => {
    it("should generate consistent hashes for binary data", () => {
      const data1 = new Uint8Array([1, 2, 3, 4, 5]);
      const data2 = new Uint8Array([1, 2, 3, 4, 5]);
      const data3 = new Uint8Array([1, 2, 3, 4, 6]);

      expect(hashBinary(data1)).toBe(hashBinary(data2));
      expect(hashBinary(data1)).not.toBe(hashBinary(data3));
    });
  });

  describe("hashObject", () => {
    it("should generate consistent hashes for objects regardless of property order", () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { c: 3, a: 1, b: 2 };
      const obj3 = { a: 1, b: 2, c: 4 };

      expect(hashObject(obj1)).toBe(hashObject(obj2));
      expect(hashObject(obj1)).not.toBe(hashObject(obj3));
    });
  });

  describe("hashBlob", () => {
    it("should generate consistent hashes for blob content", () => {
      const content1 = new Uint8Array([1, 2, 3, 4, 5]);
      const content2 = new Uint8Array([1, 2, 3, 4, 5]);
      const content3 = new Uint8Array([1, 2, 3, 4, 6]);

      expect(hashBlob(content1)).toBe(hashBlob(content2));
      expect(hashBlob(content1)).not.toBe(hashBlob(content3));
    });
  });

  describe("hashTree", () => {
    it("should generate consistent hashes for tree entries", () => {
      const entries1 = {
        "file1.txt": { blob_hash: "abc", metadata_hash: "def", type: "file" },
        "file2.txt": { blob_hash: "ghi", metadata_hash: "jkl", type: "file" },
      };
      const entries2 = {
        "file2.txt": { blob_hash: "ghi", metadata_hash: "jkl", type: "file" },
        "file1.txt": { blob_hash: "abc", metadata_hash: "def", type: "file" },
      };
      const entries3 = {
        "file1.txt": { blob_hash: "abc", metadata_hash: "def", type: "file" },
        "file2.txt": { blob_hash: "xyz", metadata_hash: "jkl", type: "file" },
      };

      expect(hashTree(entries1)).toBe(hashTree(entries2));
      expect(hashTree(entries1)).not.toBe(hashTree(entries3));
    });
  });

  describe("hashCommit", () => {
    it("should generate consistent hashes for commit objects", () => {
      const commit1 = {
        tree_hash: "abc",
        parent_hashes: ["def", "ghi"],
        author: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:00:00Z",
        },
        committer: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:00:00Z",
        },
        message: "Initial commit",
      };
      const commit2 = {
        tree_hash: "abc",
        parent_hashes: ["def", "ghi"],
        author: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:00:00Z",
        },
        committer: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:00:00Z",
        },
        message: "Initial commit",
      };
      const commit3 = {
        tree_hash: "abc",
        parent_hashes: ["def", "ghi"],
        author: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:00:00Z",
        },
        committer: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:00:00Z",
        },
        message: "Different message",
      };

      expect(hashCommit(commit1)).toBe(hashCommit(commit2));
      expect(hashCommit(commit1)).not.toBe(hashCommit(commit3));
    });
  });

  describe("hashMetadata", () => {
    it("should generate consistent hashes for metadata objects", () => {
      const metadata1 = {
        size: 1024,
        type: "text/plain",
        created: "2024-02-20T12:00:00Z",
      };
      const metadata2 = {
        type: "text/plain",
        size: 1024,
        created: "2024-02-20T12:00:00Z",
      };
      const metadata3 = {
        size: 1024,
        type: "text/plain",
        created: "2024-02-20T12:01:00Z",
      };

      expect(hashMetadata(metadata1)).toBe(hashMetadata(metadata2));
      expect(hashMetadata(metadata1)).not.toBe(hashMetadata(metadata3));
    });
  });
});
