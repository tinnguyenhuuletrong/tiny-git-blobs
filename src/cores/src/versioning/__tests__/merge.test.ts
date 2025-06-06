import { describe, it, expect } from "vitest";
import { mergeTrees, hasMergeConflicts, getConflictedPaths } from "../merge";
import type { ITree } from "@gitblobsdb/interface";

describe("Merge Utilities", () => {
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
