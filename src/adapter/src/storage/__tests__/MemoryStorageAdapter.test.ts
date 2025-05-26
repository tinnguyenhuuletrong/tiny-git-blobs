import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStorageAdapter } from "../MemoryStorageAdapter";
import type {
  IBlob,
  ICommit,
  IHead,
  IMetadata,
  IObject,
  IRef,
  ITree,
} from "@gitblobsdb/interface/src";

describe("MemoryStorageAdapter", () => {
  let adapter: MemoryStorageAdapter;

  beforeEach(() => {
    adapter = new MemoryStorageAdapter();
  });

  describe("Object Operations", () => {
    it("should store and retrieve objects", async () => {
      const object: IObject = {
        type: "blob",
        hash: "test-hash",
        content: new Uint8Array([1, 2, 3]),
      };

      await adapter.putObject(object);
      const retrieved = await adapter.getObject("test-hash");

      expect(retrieved).toEqual(object);
    });

    it("should return null for non-existent objects", async () => {
      const retrieved = await adapter.getObject("non-existent");
      expect(retrieved).toBeNull();
    });

    it("should check if object exists", async () => {
      const object: IObject = {
        type: "blob",
        hash: "test-hash",
        content: new Uint8Array([1, 2, 3]),
      };

      expect(await adapter.hasObject("test-hash")).toBe(false);
      await adapter.putObject(object);
      expect(await adapter.hasObject("test-hash")).toBe(true);
    });

    it("should delete objects", async () => {
      const object: IObject = {
        type: "blob",
        hash: "test-hash",
        content: new Uint8Array([1, 2, 3]),
      };

      await adapter.putObject(object);
      expect(await adapter.hasObject("test-hash")).toBe(true);
      await adapter.deleteObject("test-hash");
      expect(await adapter.hasObject("test-hash")).toBe(false);
    });
  });

  describe("Blob Operations", () => {
    it("should store and retrieve blobs", async () => {
      const blob: IBlob = {
        hash: "blob-hash",
        content: new Uint8Array([1, 2, 3]),
      };

      await adapter.putBlob(blob);
      const retrieved = await adapter.getBlob("blob-hash");

      expect(retrieved).toEqual(blob);
    });

    it("should return null for non-existent blobs", async () => {
      const retrieved = await adapter.getBlob("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("Tree Operations", () => {
    it("should store and retrieve trees", async () => {
      const tree: ITree = {
        hash: "tree-hash",
        entries: {
          "file1.txt": {
            blob_hash: "blob1",
            metadata_hash: "meta1",
            type: "file",
          },
        },
      };

      await adapter.putTree(tree);
      const retrieved = await adapter.getTree("tree-hash");

      expect(retrieved).toEqual(tree);
    });

    it("should return null for non-existent trees", async () => {
      const retrieved = await adapter.getTree("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("Commit Operations", () => {
    it("should store and retrieve commits", async () => {
      const commit: ICommit = {
        hash: "commit-hash",
        tree_hash: "tree-hash",
        parent_hashes: ["parent1", "parent2"],
        author: {
          name: "Test Author",
          email: "author@test.com",
          timestamp: "2024-01-01T00:00:00Z",
        },
        committer: {
          name: "Test Committer",
          email: "committer@test.com",
          timestamp: "2024-01-01T00:00:00Z",
        },
        message: "Test commit message",
      };

      await adapter.putCommit(commit);
      const retrieved = await adapter.getCommit("commit-hash");

      expect(retrieved).toEqual(commit);
    });

    it("should return null for non-existent commits", async () => {
      const retrieved = await adapter.getCommit("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("Metadata Operations", () => {
    it("should store and retrieve metadata", async () => {
      const metadata: IMetadata = {
        hash: "meta-hash",
        data: {
          key1: "value1",
          key2: 123,
        },
      };

      await adapter.putMetadata(metadata);
      const retrieved = await adapter.getMetadata("meta-hash");

      expect(retrieved).toEqual(metadata);
    });

    it("should return null for non-existent metadata", async () => {
      const retrieved = await adapter.getMetadata("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("Reference Operations", () => {
    it("should store and retrieve refs", async () => {
      const ref: IRef = {
        name: "refs/heads/main",
        commit_hash: "commit-hash",
      };

      await adapter.updateRef(ref.name, ref.commit_hash);
      const retrieved = await adapter.getRef(ref.name);

      expect(retrieved).toEqual(ref);
    });

    it("should return null for non-existent refs", async () => {
      const retrieved = await adapter.getRef("non-existent");
      expect(retrieved).toBeNull();
    });

    it("should list all refs", async () => {
      const refs: IRef[] = [
        { name: "refs/heads/main", commit_hash: "commit1" },
        { name: "refs/heads/feature", commit_hash: "commit2" },
      ];

      for (const ref of refs) {
        await adapter.updateRef(ref.name, ref.commit_hash);
      }

      const listedRefs = await adapter.listRefs();
      expect(listedRefs).toHaveLength(2);
      expect(listedRefs).toEqual(expect.arrayContaining(refs));
    });
  });

  describe("HEAD Operations", () => {
    it("should store and retrieve HEAD", async () => {
      const head: IHead = {
        type: "ref",
        value: "refs/heads/main",
      };

      await adapter.setHead(head);
      const retrieved = await adapter.getHead();

      expect(retrieved).toEqual(head);
    });

    it("should return null when HEAD is not set", async () => {
      const retrieved = await adapter.getHead();
      expect(retrieved).toBeNull();
    });

    it("should handle commit-type HEAD", async () => {
      const head: IHead = {
        type: "commit",
        value: "commit-hash",
      };

      await adapter.setHead(head);
      const retrieved = await adapter.getHead();

      expect(retrieved).toEqual(head);
    });
  });
});
