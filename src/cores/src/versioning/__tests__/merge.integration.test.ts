import { describe, it, expect, beforeEach } from "vitest";
import { merge } from "../merge";
import type { DiffResult } from "../diff";
import { MemoryStorageAdapter } from "@gitblobsdb/adapter/src/storage/MemoryStorageAdapter";

describe("Merge Integration Tests", () => {
  let storageA: MemoryStorageAdapter;
  let storageB: MemoryStorageAdapter;

  beforeEach(() => {
    storageA = new MemoryStorageAdapter();
    storageB = new MemoryStorageAdapter();
  });

  it("should successfully merge when B adds new files without conflicts", async () => {
    // Initial common state in both storages
    const commonCommit = {
      type: "commit" as const,
      hash: "common-commit",
      content: {
        tree_hash: "common-tree",
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
        message: "Common commit",
      },
    };

    const commonTree = {
      type: "tree" as const,
      hash: "common-tree",
      content: {
        entries: {
          "shared.txt": {
            blob_hash: "abc",
            metadata_hash: "def",
            type: "file" as const,
          },
        },
      },
    };

    // Set up initial state in both storages
    await storageA.putCommit(commonCommit);
    await storageA.putTree(commonTree);
    await storageA.setHead({ type: "commit", value: "common-commit" });

    await storageB.putCommit(commonCommit);
    await storageB.putTree(commonTree);
    await storageB.setHead({ type: "commit", value: "common-commit" });

    // B makes new commits
    const newTree = {
      type: "tree" as const,
      hash: "new-tree",
      content: {
        entries: {
          "shared.txt": {
            blob_hash: "abc",
            metadata_hash: "def",
            type: "file" as const,
          },
          "new-file.txt": {
            blob_hash: "ghi",
            metadata_hash: "jkl",
            type: "file" as const,
          },
        },
      },
    };

    const newCommit = {
      type: "commit" as const,
      hash: "new-commit",
      content: {
        tree_hash: "new-tree",
        parent_hashes: ["common-commit"],
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
        message: "New commit",
      },
    };

    await storageB.putTree(newTree);
    await storageB.putCommit(newCommit);
    await storageB.setHead({ type: "commit", value: "new-commit" });

    // Create diff result from B's changes
    const diff: DiffResult = {
      commitChains: ["common-commit", "new-commit"],
      objects: {
        commits: {
          "common-commit": commonCommit,
          "new-commit": newCommit,
        },
        trees: {
          "common-tree": commonTree,
          "new-tree": newTree,
        },
        blobs: {},
        metadata: {},
      },
    };

    // A merges B's changes
    const result = await merge(storageA, diff);

    expect(result.isSuccess).toBe(true);
    expect(result.conflicts).toHaveLength(0);

    // Verify A's state after merge
    const headA = await storageA.getHead();
    expect(headA?.value).not.toBe("common-commit");
    const mergedTree = await storageA.getTree(newTree.hash);
    expect(mergedTree).not.toBeNull();
    expect(mergedTree?.content.entries).toHaveProperty(["new-file.txt"]);
  });

  it("should detect conflicts when B modifies same file differently", async () => {
    // Initial common state in both storages
    const commonCommit = {
      type: "commit" as const,
      hash: "common-commit",
      content: {
        tree_hash: "common-tree",
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
        message: "Common commit",
      },
    };

    const commonTree = {
      type: "tree" as const,
      hash: "common-tree",
      content: {
        entries: {
          "shared.txt": {
            blob_hash: "abc",
            metadata_hash: "def",
            type: "file" as const,
          },
        },
      },
    };

    // Set up initial state in both storages
    await storageA.putCommit(commonCommit);
    await storageA.putTree(commonTree);
    await storageA.setHead({ type: "commit", value: "common-commit" });

    await storageB.putCommit(commonCommit);
    await storageB.putTree(commonTree);
    await storageB.setHead({ type: "commit", value: "common-commit" });

    // A modifies shared.txt
    const treeA = {
      type: "tree" as const,
      hash: "tree-a",
      content: {
        entries: {
          "shared.txt": {
            blob_hash: "mno",
            metadata_hash: "pqr",
            type: "file" as const,
          },
        },
      },
    };

    const commitA = {
      type: "commit" as const,
      hash: "commit-a",
      content: {
        tree_hash: "tree-a",
        parent_hashes: ["common-commit"],
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
        message: "A's commit",
      },
    };

    await storageA.putTree(treeA);
    await storageA.putCommit(commitA);
    await storageA.setHead({ type: "commit", value: "commit-a" });

    // B modifies shared.txt differently
    const treeB = {
      type: "tree" as const,
      hash: "tree-b",
      content: {
        entries: {
          "shared.txt": {
            blob_hash: "stu",
            metadata_hash: "vwx",
            type: "file" as const,
          },
        },
      },
    };

    const commitB = {
      type: "commit" as const,
      hash: "commit-b",
      content: {
        tree_hash: "tree-b",
        parent_hashes: ["common-commit"],
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
        message: "B's commit",
      },
    };

    await storageB.putTree(treeB);
    await storageB.putCommit(commitB);
    await storageB.setHead({ type: "commit", value: "commit-b" });

    // Create diff result from B's changes
    const diff: DiffResult = {
      commitChains: ["common-commit", "commit-b"],
      objects: {
        commits: {
          "common-commit": commonCommit,
          "commit-b": commitB,
        },
        trees: {
          "common-tree": commonTree,
          "tree-b": treeB,
        },
        blobs: {},
        metadata: {},
      },
    };

    // A tries to merge B's changes
    const result = await merge(storageA, diff);

    expect(result.isSuccess).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.path).toBe("shared.txt");
    expect(result.conflicts[0]?.base).toEqual(
      commonTree.content.entries["shared.txt"]
    );
    expect(result.conflicts[0]?.ours).toEqual(
      treeA.content.entries["shared.txt"]
    );
    expect(result.conflicts[0]?.theirs).toEqual(
      treeB.content.entries["shared.txt"]
    );

    // Verify A's state hasn't changed
    const headA = await storageA.getHead();
    expect(headA?.value).toBe("commit-a");
  });
});
