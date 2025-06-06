import { describe, it, expect, beforeEach } from "vitest";
import { findRevisionDiff } from "../diff";
import { MemoryStorageAdapter } from "@gitblobsdb/adapter";
import type { IBlob, ICommit, IMetadata, ITree } from "@gitblobsdb/interface";

describe("findRevisionDiff", () => {
  let storage: MemoryStorageAdapter;
  let mockBlob1: IBlob;
  let mockBlob2: IBlob;
  let mockBlob3: IBlob;
  let mockMetadata1: IMetadata;
  let mockMetadata2: IMetadata;
  let mockMetadata3: IMetadata;
  let mockTree1: ITree;
  let mockTree2: ITree;
  let mockTree3: ITree;
  let mockCommit1: ICommit;
  let mockCommit2: ICommit;
  let mockCommit3: ICommit;

  beforeEach(async () => {
    storage = new MemoryStorageAdapter();

    // Create mock blobs
    mockBlob1 = {
      type: "blob",
      hash: "blob1",
      content: {
        data: new Uint8Array([1, 2, 3]),
      },
    };

    mockBlob2 = {
      type: "blob",
      hash: "blob2",
      content: {
        data: new Uint8Array([4, 5, 6]),
      },
    };

    mockBlob3 = {
      type: "blob",
      hash: "blob3",
      content: {
        data: new Uint8Array([7, 8, 9]),
      },
    };

    // Create mock metadata
    mockMetadata1 = {
      type: "metadata",
      hash: "meta1",
      content: {
        data: {
          size: 3,
          type: "text/plain",
        },
      },
    };

    mockMetadata2 = {
      type: "metadata",
      hash: "meta2",
      content: {
        data: {
          size: 3,
          type: "text/plain",
        },
      },
    };

    mockMetadata3 = {
      type: "metadata",
      hash: "meta3",
      content: {
        data: {
          size: 3,
          type: "text/plain",
        },
      },
    };

    // Create mock trees
    mockTree1 = {
      type: "tree",
      hash: "tree1",
      content: {
        entries: {
          "file1.txt": {
            blob_hash: "blob1",
            metadata_hash: "meta1",
            type: "file",
          },
        },
      },
    };

    mockTree2 = {
      type: "tree",
      hash: "tree2",
      content: {
        entries: {
          "file1.txt": {
            blob_hash: "blob2",
            metadata_hash: "meta2",
            type: "file",
          },
        },
      },
    };

    mockTree3 = {
      type: "tree",
      hash: "tree3",
      content: {
        entries: {
          "file1.txt": {
            blob_hash: "blob3",
            metadata_hash: "meta3",
            type: "file",
          },
        },
      },
    };

    // Create mock commits
    mockCommit1 = {
      type: "commit",
      hash: "commit1",
      content: {
        tree_hash: "tree1",
        parent_hashes: [],
        author: {
          name: "Test Author",
          email: "test@example.com",
          timestamp: "2024-01-01T00:00:00Z",
        },
        committer: {
          name: "Test Committer",
          email: "test@example.com",
          timestamp: "2024-01-01T00:00:00Z",
        },
        message: "Initial commit",
      },
    };

    mockCommit2 = {
      type: "commit",
      hash: "commit2",
      content: {
        tree_hash: "tree2",
        parent_hashes: ["commit1"],
        author: {
          name: "Test Author",
          email: "test@example.com",
          timestamp: "2024-01-02T00:00:00Z",
        },
        committer: {
          name: "Test Committer",
          email: "test@example.com",
          timestamp: "2024-01-02T00:00:00Z",
        },
        message: "Second commit",
      },
    };

    mockCommit3 = {
      type: "commit",
      hash: "commit3",
      content: {
        tree_hash: "tree3",
        parent_hashes: ["commit2"],
        author: {
          name: "Test Author",
          email: "test@example.com",
          timestamp: "2024-01-03T00:00:00Z",
        },
        committer: {
          name: "Test Committer",
          email: "test@example.com",
          timestamp: "2024-01-03T00:00:00Z",
        },
        message: "Third commit",
      },
    };

    // Store objects in the adapter
    await storage.putBlob(mockBlob1);
    await storage.putBlob(mockBlob2);
    await storage.putBlob(mockBlob3);
    await storage.putMetadata(mockMetadata1);
    await storage.putMetadata(mockMetadata2);
    await storage.putMetadata(mockMetadata3);
    await storage.putTree(mockTree1);
    await storage.putTree(mockTree2);
    await storage.putTree(mockTree3);
    await storage.putCommit(mockCommit1);
    await storage.putCommit(mockCommit2);
    await storage.putCommit(mockCommit3);
  });

  it("should find all objects between two commits", async () => {
    const result = await findRevisionDiff(storage, "commit1", "commit2");

    // Check commits
    expect(result.commitChains).toEqual(["commit1", "commit2"]);

    // Check blobs
    expect(result.objects.blobs).toEqual({
      blob1: mockBlob1,
      blob2: mockBlob2,
    });

    // Check trees
    expect(result.objects.trees).toEqual({
      tree1: mockTree1,
      tree2: mockTree2,
    });

    // Check metadata
    expect(result.objects.metadata).toEqual({
      meta1: mockMetadata1,
      meta2: mockMetadata2,
    });
  });

  it("should stop collecting when fromCommitHash is reached", async () => {
    const result = await findRevisionDiff(storage, "commit2", "commit3");

    // Check commits
    expect(result.commitChains).toEqual(["commit2", "commit3"]);

    // Check blobs - should include all blobs
    expect(result.objects.blobs).toEqual({
      blob2: mockBlob2,
      blob3: mockBlob3,
    });

    // Check trees - should include all trees
    expect(result.objects.trees).toEqual({
      tree2: mockTree2,
      tree3: mockTree3,
    });

    // Check metadata - should include all metadata
    expect(result.objects.metadata).toEqual({
      meta2: mockMetadata2,
      meta3: mockMetadata3,
    });
  });

  it("should throw error when commit is not found", async () => {
    await expect(
      findRevisionDiff(storage, "nonexistent", "commit2")
    ).rejects.toThrow("Commit not found: nonexistent");
  });

  it("should throw error when tree is not found", async () => {
    await storage.deleteObject("tree2");
    await expect(
      findRevisionDiff(storage, "commit1", "commit2")
    ).rejects.toThrow("Tree not found: tree2");
  });

  it("should throw error when blob is not found", async () => {
    await storage.deleteObject("blob2");
    await expect(
      findRevisionDiff(storage, "commit1", "commit2")
    ).rejects.toThrow("Blob not found: blob2");
  });

  it("should respect maxDepth parameter", async () => {
    // Create a deep chain of commits
    const deepCommit = {
      ...mockCommit3,
      hash: "deepCommit",
      parent_hashes: ["commit3"],
    };
    await storage.putCommit(deepCommit);

    // Should work with default maxDepth
    await expect(
      findRevisionDiff(storage, "commit1", "deepCommit")
    ).resolves.toBeDefined();

    // Should fail with low maxDepth
    await expect(
      findRevisionDiff(storage, "commit1", "deepCommit", 1)
    ).rejects.toThrow("Maximum depth 1 exceeded while traversing commits");
  });
});
