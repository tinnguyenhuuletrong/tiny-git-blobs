import { describe, it, expect } from "vitest";
import {
  createBlob,
  createMetadata,
  createTree,
  createCommit,
} from "../create";

describe("Object Creation Utilities", () => {
  describe("createBlob", () => {
    it("should create a blob with correct hash and content", () => {
      const content = new Uint8Array([1, 2, 3, 4, 5]);
      const blob = createBlob(content);

      expect(blob).toHaveProperty("hash");
      expect(blob).toHaveProperty("content");
      expect(blob.content.data).toBe(content);
      expect(blob.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });
  });

  describe("createMetadata", () => {
    it("should create metadata with correct hash and data", () => {
      const data = {
        size: 1024,
        type: "text/plain",
        created: "2024-02-20T12:00:00Z",
      };
      const metadata = createMetadata(data);

      expect(metadata).toHaveProperty("hash");
      expect(metadata).toHaveProperty("content");
      expect(metadata.content.data).toBe(data);
      expect(metadata.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("createTree", () => {
    it("should create a tree with correct hash and entries", () => {
      const entries = {
        "file1.txt": {
          blob_hash: "abc",
          metadata_hash: "def",
          type: "file" as const,
        },
        "file2.txt": {
          blob_hash: "ghi",
          metadata_hash: "jkl",
          type: "file" as const,
        },
      };
      const tree = createTree(entries);

      expect(tree).toHaveProperty("hash");
      expect(tree).toHaveProperty("content");
      expect(tree.content.entries).toBe(entries);
      expect(tree.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("createCommit", () => {
    it("should create a commit with correct hash and properties", () => {
      const params = {
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
      const commit = createCommit(params);

      expect(commit).toHaveProperty("hash");
      expect(commit.content.tree_hash).toBe(params.tree_hash);
      expect(commit.content.parent_hashes).toBe(params.parent_hashes);
      expect(commit.content.author).toBe(params.author);
      expect(commit.content.committer).toBe(params.committer);
      expect(commit.content.message).toBe(params.message);
      expect(commit.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
