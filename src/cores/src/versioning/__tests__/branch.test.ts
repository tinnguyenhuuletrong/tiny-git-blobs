import { describe, it, expect } from "vitest";
import {
  createBranch,
  createTag,
  updateBranch,
  createHeadFromBranch,
  createHeadFromCommit,
  isDetachedHead,
  getBranchFromHead,
  getCommitFromHead,
} from "../branch";

describe("Branch Management Utilities", () => {
  describe("createBranch", () => {
    it("should create a branch with correct name and commit hash", () => {
      const branch = createBranch("main", "abc123");
      expect(branch.name).toBe("refs/heads/main");
      expect(branch.commit_hash).toBe("abc123");
    });

    it("should not modify branch name if it already has refs/heads/ prefix", () => {
      const branch = createBranch("refs/heads/main", "abc123");
      expect(branch.name).toBe("refs/heads/main");
      expect(branch.commit_hash).toBe("abc123");
    });
  });

  describe("createTag", () => {
    it("should create a tag with correct name and commit hash", () => {
      const tag = createTag("v1.0", "abc123");
      expect(tag.name).toBe("refs/tags/v1.0");
      expect(tag.commit_hash).toBe("abc123");
    });

    it("should not modify tag name if it already has refs/tags/ prefix", () => {
      const tag = createTag("refs/tags/v1.0", "abc123");
      expect(tag.name).toBe("refs/tags/v1.0");
      expect(tag.commit_hash).toBe("abc123");
    });
  });

  describe("updateBranch", () => {
    it("should update branch commit hash", () => {
      const branch = createBranch("main", "abc123");
      const updated = updateBranch(branch, "def456");
      expect(updated.name).toBe(branch.name);
      expect(updated.commit_hash).toBe("def456");
    });
  });

  describe("createHeadFromBranch", () => {
    it("should create HEAD reference pointing to a branch", () => {
      const head = createHeadFromBranch("main");
      expect(head.type).toBe("ref");
      expect(head.value).toBe("refs/heads/main");
    });

    it("should not modify branch name if it already has refs/heads/ prefix", () => {
      const head = createHeadFromBranch("refs/heads/main");
      expect(head.type).toBe("ref");
      expect(head.value).toBe("refs/heads/main");
    });
  });

  describe("createHeadFromCommit", () => {
    it("should create HEAD reference pointing to a commit", () => {
      const head = createHeadFromCommit("abc123");
      expect(head.type).toBe("commit");
      expect(head.value).toBe("abc123");
    });
  });

  describe("isDetachedHead", () => {
    it("should return true for detached HEAD", () => {
      const head = createHeadFromCommit("abc123");
      expect(isDetachedHead(head)).toBe(true);
    });

    it("should return false for branch HEAD", () => {
      const head = createHeadFromBranch("main");
      expect(isDetachedHead(head)).toBe(false);
    });
  });

  describe("getBranchFromHead", () => {
    it("should return branch name for branch HEAD", () => {
      const head = createHeadFromBranch("main");
      expect(getBranchFromHead(head)).toBe("refs/heads/main");
    });

    it("should return null for detached HEAD", () => {
      const head = createHeadFromCommit("abc123");
      expect(getBranchFromHead(head)).toBe(null);
    });
  });

  describe("getCommitFromHead", () => {
    it("should return commit hash for detached HEAD", () => {
      const head = createHeadFromCommit("abc123");
      expect(getCommitFromHead(head)).toBe("abc123");
    });

    it("should throw error for branch HEAD", () => {
      const head = createHeadFromBranch("main");
      expect(() => getCommitFromHead(head)).toThrow(
        "HEAD is not in detached state"
      );
    });
  });
});
