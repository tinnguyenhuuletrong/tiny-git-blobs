import { describe, it, expect, beforeEach } from "vitest";
import {
  mergeTrees,
  hasMergeConflicts,
  getConflictedPaths,
  merge,
  type MergeResult,
} from "../merge";
import type { ITree } from "@gitblobsdb/interface";
import type { DiffResult } from "../diff";
import { MemoryStorageAdapter } from "@gitblobsdb/adapter";

describe("Merge Utilities", () => {
  describe("merge", () => {
    let storage: MemoryStorageAdapter;

    beforeEach(() => {
      storage = new MemoryStorageAdapter();
    });

    it("should merge changes from diff without conflicts", async () => {
      // Set up initial state
      const currentCommit = {
        type: "commit" as const,
        hash: "current-commit",
        content: {
          tree_hash: "current-tree",
          parent_hashes: [],
          author: {
            name: "Test",
            email: "test@test.com",
            timestamp: "2024-03-20T12:00:00Z",
          },
          committer: {
            name: "Test",
            email: "test@test.com",
            timestamp: "2024-03-20T12:00:00Z",
          },
          message: "Test commit",
        },
      };

      const currentTree = {
        type: "tree" as const,
        hash: "current-tree",
        content: {
          entries: {
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
          },
        },
      };

      await storage.putCommit(currentCommit);
      await storage.putTree(currentTree);
      await storage.setHead({ type: "commit", value: "current-commit" });

      // Create diff result
      const diff: DiffResult = {
        commitChains: ["base-commit", "target-commit"],
        objects: {
          commits: {
            "base-commit": {
              type: "commit" as const,
              hash: "base-commit",
              content: {
                tree_hash: "base-tree",
                parent_hashes: [],
                author: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                committer: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                message: "Base commit",
              },
            },
            "target-commit": {
              type: "commit" as const,
              hash: "target-commit",
              content: {
                tree_hash: "target-tree",
                parent_hashes: ["base-commit"],
                author: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                committer: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                message: "Target commit",
              },
            },
          },
          trees: {
            "base-tree": {
              type: "tree" as const,
              hash: "base-tree",
              content: {
                entries: {
                  "file1.txt": {
                    blob_hash: "abc",
                    metadata_hash: "def",
                    type: "file" as const,
                  },
                },
              },
            },
            "target-tree": {
              type: "tree" as const,
              hash: "target-tree",
              content: {
                entries: {
                  "file1.txt": {
                    blob_hash: "abc",
                    metadata_hash: "def",
                    type: "file" as const,
                  },
                  "file3.txt": {
                    blob_hash: "stu",
                    metadata_hash: "vwx",
                    type: "file" as const,
                  },
                },
              },
            },
          },
          blobs: {},
          metadata: {},
        },
      };

      const result = await merge(storage, diff);

      expect(result.isSuccess).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      const head = await storage.getHead();
      expect(head).not.toBeNull();
      expect(head?.type).toBe("commit");
      expect(head?.value).not.toBe("current-commit"); // Should be the new merge commit
    });

    it("should return false when there are conflicts", async () => {
      // Set up initial state
      const currentCommit = {
        type: "commit" as const,
        hash: "current-commit",
        content: {
          tree_hash: "current-tree",
          parent_hashes: [],
          author: {
            name: "Test",
            email: "test@test.com",
            timestamp: "2024-03-20T12:00:00Z",
          },
          committer: {
            name: "Test",
            email: "test@test.com",
            timestamp: "2024-03-20T12:00:00Z",
          },
          message: "Test commit",
        },
      };

      const currentTree = {
        type: "tree" as const,
        hash: "current-tree",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "mno",
              metadata_hash: "pqr",
              type: "file" as const,
            },
          },
        },
      };

      await storage.putCommit(currentCommit);
      await storage.putTree(currentTree);
      await storage.setHead({ type: "commit", value: "current-commit" });

      // Create diff result
      const diff: DiffResult = {
        commitChains: ["base-commit", "target-commit"],
        objects: {
          commits: {
            "base-commit": {
              type: "commit" as const,
              hash: "base-commit",
              content: {
                tree_hash: "base-tree",
                parent_hashes: [],
                author: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                committer: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                message: "Base commit",
              },
            },
            "target-commit": {
              type: "commit" as const,
              hash: "target-commit",
              content: {
                tree_hash: "target-tree",
                parent_hashes: ["base-commit"],
                author: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                committer: {
                  name: "Test",
                  email: "test@test.com",
                  timestamp: "2024-03-20T12:00:00Z",
                },
                message: "Target commit",
              },
            },
          },
          trees: {
            "base-tree": {
              type: "tree" as const,
              hash: "base-tree",
              content: {
                entries: {
                  "file1.txt": {
                    blob_hash: "abc",
                    metadata_hash: "def",
                    type: "file" as const,
                  },
                },
              },
            },
            "target-tree": {
              type: "tree" as const,
              hash: "target-tree",
              content: {
                entries: {
                  "file1.txt": {
                    blob_hash: "stu",
                    metadata_hash: "vwx",
                    type: "file" as const,
                  },
                },
              },
            },
          },
          blobs: {},
          metadata: {},
        },
      };

      const result = await merge(storage, diff);

      expect(result.isSuccess).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]?.path).toBe("file1.txt");
      const head = await storage.getHead();
      expect(head?.value).toBe("current-commit"); // HEAD should not change
    });

    it("should throw error if HEAD not found", async () => {
      const diff: DiffResult = {
        commitChains: [],
        objects: {
          commits: {},
          trees: {},
          blobs: {},
          metadata: {},
        },
      };

      await expect(merge(storage, diff)).rejects.toThrow(
        "No HEAD found in storage"
      );
    });
  });

  describe("mergeTrees", () => {
    it("should merge trees without conflicts", () => {
      const base: ITree = {
        type: "tree",
        hash: "base",
        content: {
          entries: {
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
          },
        },
      };

      const ours: ITree = {
        type: "tree",
        hash: "ours",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "abc",
              metadata_hash: "def",
              type: "file" as const,
            },
            "file2.txt": {
              blob_hash: "mno",
              metadata_hash: "pqr",
              type: "file" as const,
            },
            "file3.txt": {
              blob_hash: "stu",
              metadata_hash: "vwx",
              type: "file" as const,
            },
          },
        },
      };

      const theirs: ITree = {
        type: "tree",
        hash: "theirs",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "abc",
              metadata_hash: "def",
              type: "file" as const,
            },
            "file2.txt": {
              blob_hash: "mno",
              metadata_hash: "pqr",
              type: "file" as const,
            },
            "file4.txt": {
              blob_hash: "yz1",
              metadata_hash: "234",
              type: "file" as const,
            },
          },
        },
      };

      const { merged, conflicts } = mergeTrees(base, ours, theirs);

      expect(conflicts).toHaveLength(0);
      expect(merged.content.entries).toHaveProperty(["file1.txt"]);
      expect(merged.content.entries).toHaveProperty(["file2.txt"]);
      expect(merged.content.entries).toHaveProperty(["file3.txt"]);
      expect(merged.content.entries).toHaveProperty(["file4.txt"]);
      expect(merged.content.entries["file2.txt"]?.blob_hash).toBe("mno");
    });

    it("should handle file additions without conflicts", () => {
      const base: ITree = {
        type: "tree",
        hash: "base",
        content: {
          entries: {},
        },
      };

      const ours: ITree = {
        type: "tree",
        hash: "ours",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "abc",
              metadata_hash: "def",
              type: "file" as const,
            },
          },
        },
      };

      const theirs: ITree = {
        type: "tree",
        hash: "theirs",
        content: {
          entries: {
            "file2.txt": {
              blob_hash: "ghi",
              metadata_hash: "jkl",
              type: "file" as const,
            },
          },
        },
      };

      const { merged, conflicts } = mergeTrees(base, ours, theirs);

      expect(conflicts).toHaveLength(0);
      expect(merged.content.entries).toHaveProperty(["file1.txt"]);
      expect(merged.content.entries).toHaveProperty(["file2.txt"]);
      expect(merged.content.entries["file1.txt"]?.blob_hash).toBe("abc");
      expect(merged.content.entries["file2.txt"]?.blob_hash).toBe("ghi");
    });

    it("should detect conflicts when both sides modify the same file differently", () => {
      const base: ITree = {
        type: "tree",
        hash: "base",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "abc",
              metadata_hash: "def",
              type: "file" as const,
            },
          },
        },
      };

      const ours: ITree = {
        type: "tree",
        hash: "ours",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "mno",
              metadata_hash: "pqr",
              type: "file" as const,
            },
          },
        },
      };

      const theirs: ITree = {
        type: "tree",
        hash: "theirs",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "stu",
              metadata_hash: "vwx",
              type: "file" as const,
            },
          },
        },
      };

      const { merged, conflicts } = mergeTrees(base, ours, theirs);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]?.path).toBe("file1.txt");
      expect(conflicts[0]?.base).toEqual(base.content.entries["file1.txt"]);
      expect(conflicts[0]?.ours).toEqual(ours.content.entries["file1.txt"]);
      expect(conflicts[0]?.theirs).toEqual(theirs.content.entries["file1.txt"]);
    });

    it("should detect conflicts when one side deletes a file and the other modifies it", () => {
      const base: ITree = {
        type: "tree",
        hash: "base",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "abc",
              metadata_hash: "def",
              type: "file" as const,
            },
          },
        },
      };

      const ours: ITree = {
        type: "tree",
        hash: "ours",
        content: {
          entries: {}, // Deleted file1.txt
        },
      };

      const theirs: ITree = {
        type: "tree",
        hash: "theirs",
        content: {
          entries: {
            "file1.txt": {
              blob_hash: "mno",
              metadata_hash: "pqr",
              type: "file" as const,
            },
          },
        },
      };

      const { merged, conflicts } = mergeTrees(base, ours, theirs);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]?.path).toBe("file1.txt");
      expect(conflicts[0]?.base).toEqual(base.content.entries["file1.txt"]);
      expect(conflicts[0]?.ours).toBeNull();
      expect(conflicts[0]?.theirs).toEqual(theirs.content.entries["file1.txt"]);
    });
  });

  describe("hasMergeConflicts", () => {
    it("should return true when there are conflicts", () => {
      const conflicts = [
        {
          path: "file1.txt",
          base: {
            blob_hash: "abc",
            metadata_hash: "def",
            type: "file" as const,
          },
          ours: {
            blob_hash: "mno",
            metadata_hash: "pqr",
            type: "file" as const,
          },
          theirs: {
            blob_hash: "stu",
            metadata_hash: "vwx",
            type: "file" as const,
          },
        },
      ];

      expect(hasMergeConflicts(conflicts)).toBe(true);
    });

    it("should return false when there are no conflicts", () => {
      expect(hasMergeConflicts([])).toBe(false);
    });
  });

  describe("getConflictedPaths", () => {
    it("should return list of paths with conflicts", () => {
      const conflicts = [
        {
          path: "file1.txt",
          base: {
            blob_hash: "abc",
            metadata_hash: "def",
            type: "file" as const,
          },
          ours: {
            blob_hash: "mno",
            metadata_hash: "pqr",
            type: "file" as const,
          },
          theirs: {
            blob_hash: "stu",
            metadata_hash: "vwx",
            type: "file" as const,
          },
        },
        {
          path: "file2.txt",
          base: {
            blob_hash: "ghi",
            metadata_hash: "jkl",
            type: "file" as const,
          },
          ours: null,
          theirs: {
            blob_hash: "yz1",
            metadata_hash: "234",
            type: "file" as const,
          },
        },
      ];

      expect(getConflictedPaths(conflicts)).toEqual(["file1.txt", "file2.txt"]);
    });

    it("should return empty array when there are no conflicts", () => {
      expect(getConflictedPaths([])).toEqual([]);
    });
  });
});
