import { fastForward } from "../fastForward";
import { MemoryStorageAdapter } from "@gitblobsdb/adapter";
import type { DiffResult } from "../diff";
import { describe, beforeEach, it, expect } from "vitest";

describe("FastForward Utilities", () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it("should fast-forward changes when HEAD matches the first commit in commitChains", async () => {
    // Set up initial state
    const firstCommit = {
      type: "commit" as const,
      hash: "first-commit",
      content: {
        tree_hash: "first-tree",
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
        message: "First commit",
      },
    };

    const firstTree = {
      type: "tree" as const,
      hash: "first-tree",
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

    await storage.putCommit(firstCommit);
    await storage.putTree(firstTree);
    await storage.setHead({ type: "commit", value: "first-commit" });

    // Create diff result
    const diff: DiffResult = {
      commitChains: ["first-commit", "second-commit"],
      objects: {
        commits: {
          "first-commit": firstCommit,
          "second-commit": {
            type: "commit" as const,
            hash: "second-commit",
            content: {
              tree_hash: "second-tree",
              parent_hashes: ["first-commit"],
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
              message: "Second commit",
            },
          },
        },
        trees: {
          "first-tree": firstTree,
          "second-tree": {
            type: "tree" as const,
            hash: "second-tree",
            content: {
              entries: {
                "file1.txt": {
                  blob_hash: "ghi",
                  metadata_hash: "jkl",
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

    const result = await fastForward(storage, diff);

    expect(result.isSuccess).toBe(true);
    const head = await storage.getHead();
    expect(head).not.toBeNull();
    expect(head?.type).toBe("commit");
    expect(head?.value).toBe("second-commit");
  });

  it("should throw an error when HEAD does not match the first commit in commitChains", async () => {
    // Set up initial state
    await storage.setHead({ type: "commit", value: "different-commit" });

    // Create diff result
    const diff: DiffResult = {
      commitChains: ["first-commit", "second-commit"],
      objects: {
        commits: {},
        trees: {},
        blobs: {},
        metadata: {},
      },
    };

    await expect(fastForward(storage, diff)).rejects.toThrow(
      "HEAD does not match the first commit in commitChains"
    );
  });
});
