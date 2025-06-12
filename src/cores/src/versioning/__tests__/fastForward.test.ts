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

  it("should store blobs and metadata when fast-forwarding", async () => {
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
            blob_hash: "blob1",
            metadata_hash: "meta1",
            type: "file" as const,
          },
        },
      },
    };

    const blob1 = {
      type: "blob" as const,
      hash: "blob1",
      content: {
        data: new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
        ]), // "Hello World" in bytes
      },
    };

    const metadata1 = {
      type: "metadata" as const,
      hash: "meta1",
      content: {
        data: {
          size: 11,
          created: "2024-03-20T12:00:00Z",
          modified: "2024-03-20T12:00:00Z",
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
                  blob_hash: "blob1",
                  metadata_hash: "meta1",
                  type: "file" as const,
                },
              },
            },
          },
        },
        blobs: {
          blob1: blob1,
        },
        metadata: {
          meta1: metadata1,
        },
      },
    };

    const result = await fastForward(storage, diff);

    expect(result.isSuccess).toBe(true);
    expect(await storage.hasObject("blob1")).toBe(true);
    expect(await storage.hasObject("meta1")).toBe(true);
  });

  it("should throw an error when a commit is not found in diff", async () => {
    await storage.setHead({ type: "commit", value: "first-commit" });

    const diff: DiffResult = {
      commitChains: ["first-commit", "missing-commit"],
      objects: {
        commits: {
          "first-commit": {
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
          },
        },
        trees: {
          "first-tree": {
            type: "tree" as const,
            hash: "first-tree",
            content: {
              entries: {},
            },
          },
        },
        blobs: {},
        metadata: {},
      },
    };

    await expect(fastForward(storage, diff)).rejects.toThrow(
      "Commit missing-commit not found in diff"
    );
  });

  it("should throw an error when a tree is not found in diff", async () => {
    const firstCommit = {
      type: "commit" as const,
      hash: "first-commit",
      content: {
        tree_hash: "missing-tree",
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

    await storage.putCommit(firstCommit);
    await storage.setHead({ type: "commit", value: "first-commit" });

    const diff: DiffResult = {
      commitChains: ["first-commit"],
      objects: {
        commits: {
          "first-commit": firstCommit,
        },
        trees: {},
        blobs: {},
        metadata: {},
      },
    };

    await expect(fastForward(storage, diff)).rejects.toThrow(
      "Tree missing-tree not found in diff"
    );
  });

  it("should not store objects that already exist in storage", async () => {
    // Set up initial state with existing objects
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
            blob_hash: "blob1",
            metadata_hash: "meta1",
            type: "file" as const,
          },
        },
      },
    };

    const blob1 = {
      type: "blob" as const,
      hash: "blob1",
      content: {
        data: new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
        ]), // "Hello World" in bytes
      },
    };

    const metadata1 = {
      type: "metadata" as const,
      hash: "meta1",
      content: {
        data: {
          size: 11,
          created: "2024-03-20T12:00:00Z",
          modified: "2024-03-20T12:00:00Z",
        },
      },
    };

    // Store all objects initially
    await storage.putCommit(firstCommit);
    await storage.putTree(firstTree);
    await storage.putBlob(blob1);
    await storage.putMetadata(metadata1);
    await storage.setHead({ type: "commit", value: "first-commit" });

    // Create diff with the same objects
    const diff: DiffResult = {
      commitChains: ["first-commit"],
      objects: {
        commits: {
          "first-commit": firstCommit,
        },
        trees: {
          "first-tree": firstTree,
        },
        blobs: {
          blob1: blob1,
        },
        metadata: {
          meta1: metadata1,
        },
      },
    };

    const result = await fastForward(storage, diff);

    expect(result.isSuccess).toBe(true);
    // Verify objects still exist
    expect(await storage.hasObject("blob1")).toBe(true);
    expect(await storage.hasObject("meta1")).toBe(true);
  });
});
