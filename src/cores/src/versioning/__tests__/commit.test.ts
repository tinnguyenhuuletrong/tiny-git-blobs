import { describe, it, expect } from "vitest";
import {
  isFastForward,
  findCommonAncestor,
  createMergeCommit,
  isMergeCommit,
} from "../commit";
import { createCommit } from "../../objects/create";

describe("Commit Versioning Utilities", () => {
  describe("isFastForward", () => {
    it("should return true for same commit", () => {
      const commit = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
      });

      expect(isFastForward(commit, commit)).toBe(true);
    });

    it("should return true for direct descendant", () => {
      const parent = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
      });

      const child = createCommit({
        tree_hash: "ghi",
        parent_hashes: [parent.hash],
        author: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:01:00Z",
        },
        committer: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:01:00Z",
        },
        message: "Second commit",
      });

      expect(isFastForward(parent, child)).toBe(true);
    });

    it("should return false for unrelated commits", () => {
      const commit1 = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
      });

      const commit2 = createCommit({
        tree_hash: "ghi",
        parent_hashes: ["jkl"],
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
        message: "Another commit",
      });

      expect(isFastForward(commit1, commit2)).toBe(false);
    });
  });

  describe("findCommonAncestor", () => {
    it("should return the commit if both are the same", () => {
      const commit = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
      });

      expect(findCommonAncestor(commit, commit)).toBe(commit);
    });

    it("should find direct parent-child relationship", () => {
      const parent = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
      });

      const child = createCommit({
        tree_hash: "ghi",
        parent_hashes: [parent.hash],
        author: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:01:00Z",
        },
        committer: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:01:00Z",
        },
        message: "Second commit",
      });

      expect(findCommonAncestor(parent, child)).toBe(parent);
      expect(findCommonAncestor(child, parent)).toBe(parent);
    });

    it("should return null for unrelated commits", () => {
      const commit1 = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
      });

      const commit2 = createCommit({
        tree_hash: "ghi",
        parent_hashes: ["jkl"],
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
        message: "Another commit",
      });

      expect(findCommonAncestor(commit1, commit2)).toBe(null);
    });
  });

  describe("createMergeCommit", () => {
    it("should create a merge commit with multiple parents", () => {
      const parent1 = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
      });

      const parent2 = createCommit({
        tree_hash: "ghi",
        parent_hashes: ["jkl"],
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
        message: "Another commit",
      });

      const mergeCommit = createMergeCommit({
        tree_hash: "mno",
        parent_hashes: [parent1.hash, parent2.hash],
        author: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:02:00Z",
        },
        committer: {
          name: "John",
          email: "john@example.com",
          timestamp: "2024-02-20T12:02:00Z",
        },
        message: "Merge commit",
      });

      expect(mergeCommit.parent_hashes).toHaveLength(2);
      expect(mergeCommit.parent_hashes).toContain(parent1.hash);
      expect(mergeCommit.parent_hashes).toContain(parent2.hash);
    });
  });

  describe("isMergeCommit", () => {
    it("should return true for merge commits", () => {
      const mergeCommit = createCommit({
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
        message: "Merge commit",
      });

      expect(isMergeCommit(mergeCommit)).toBe(true);
    });

    it("should return false for regular commits", () => {
      const regularCommit = createCommit({
        tree_hash: "abc",
        parent_hashes: ["def"],
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
        message: "Regular commit",
      });

      expect(isMergeCommit(regularCommit)).toBe(false);
    });
  });
});
