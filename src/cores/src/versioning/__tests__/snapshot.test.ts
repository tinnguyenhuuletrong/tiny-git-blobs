import { describe, it, expect, beforeEach } from "vitest";
import { createTreeSnapshot } from "../snapshot";
import { IBlob, ICommit, IMetadata, ITree } from "@gitblobsdb/interface";
import { MemoryStorageAdapter } from "@gitblobsdb/adapter";

describe("createTreeSnapshot", () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  const mockCommit: ICommit = {
    type: "commit",
    hash: "commit123",
    content: {
      tree_hash: "tree123",
      parent_hashes: [],
      author: {
        name: "Test Author",
        email: "test@example.com",
        timestamp: "2024-03-20T12:00:00Z",
      },
      committer: {
        name: "Test Committer",
        email: "test@example.com",
        timestamp: "2024-03-20T12:00:00Z",
      },
      message: "Test commit",
    },
  };

  const mockTree: ITree = {
    type: "tree",
    hash: "tree123",
    content: {
      entries: {
        "file1.txt": {
          blob_hash: "blob123",
          metadata_hash: "meta123",
          type: "file",
        },
      },
    },
  };

  const mockBlob: IBlob = {
    type: "blob",
    hash: "blob123",
    content: {
      data: new Uint8Array([1, 2, 3]),
    },
  };

  const mockMetadata: IMetadata = {
    type: "metadata",
    hash: "meta123",
    content: {
      data: {
        size: 3,
        type: "text/plain",
      },
    },
  };

  it("should create a tree snapshot successfully", async () => {
    // Setup storage with test data
    await storage.putCommit(mockCommit);
    await storage.putTree(mockTree);
    await storage.putBlob(mockBlob);
    await storage.putMetadata(mockMetadata);

    const snapshot = await createTreeSnapshot("commit123", storage);

    expect(snapshot.commitHash).toBe("commit123");
    expect(snapshot.treeData).toHaveProperty(["file1.txt"]);
    expect(snapshot.treeData["file1.txt"]).toEqual({
      blob_hash: "blob123",
      metadata_hash: "meta123",
      type: "file",
      metadata: mockMetadata.content.data,
      blob: mockBlob.content.data,
    });
  });

  it("should throw error when commit is not found", async () => {
    await expect(createTreeSnapshot("nonexistent", storage)).rejects.toThrow(
      "Commit not found: nonexistent"
    );
  });

  it("should throw error when tree is not found", async () => {
    await storage.putCommit(mockCommit);
    // Don't put the tree

    await expect(createTreeSnapshot("commit123", storage)).rejects.toThrow(
      "Tree not found: tree123"
    );
  });

  it("should throw error when blob is not found", async () => {
    await storage.putCommit(mockCommit);
    await storage.putTree(mockTree);
    // Don't put the blob

    await expect(createTreeSnapshot("commit123", storage)).rejects.toThrow(
      "Blob not found: blob123"
    );
  });
});
