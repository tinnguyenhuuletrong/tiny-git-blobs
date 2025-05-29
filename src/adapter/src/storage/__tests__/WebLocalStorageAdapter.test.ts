import "./_setup_dom";

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WebLocalStorageAdapter } from "../WebLocalStorageAdapter";
import type {
  IBlob,
  ICommit,
  IHead,
  IMetadata,
  IObject,
  IRef,
  ITree,
} from "@gitblobsdb/interface";

describe("WebLocalStorageAdapter", () => {
  let adapter: WebLocalStorageAdapter;
  const TEST_PREFIX = "test-gitblobsdb";

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    adapter = new WebLocalStorageAdapter(TEST_PREFIX);
  });

  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe("Object Operations", () => {
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
        hash: "test-blob",
        content: new Uint8Array([1, 2, 3]),
      };

      await adapter.putBlob(blob);
      const retrieved = await adapter.getBlob("test-blob");

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
        hash: "test-tree",
        entries: {
          "file1.txt": {
            blob_hash: "blob1",
            metadata_hash: "meta1",
            type: "file",
          },
        },
      };

      await adapter.putTree(tree);
      const retrieved = await adapter.getTree("test-tree");

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
        hash: "test-commit",
        tree_hash: "test-tree",
        parent_hashes: [],
        author: {
          name: "Test Author",
          email: "test@example.com",
          timestamp: new Date().toISOString(),
        },
        committer: {
          name: "Test Committer",
          email: "test@example.com",
          timestamp: new Date().toISOString(),
        },
        message: "Test commit",
      };

      await adapter.putCommit(commit);
      const retrieved = await adapter.getCommit("test-commit");

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
        hash: "test-metadata",
        data: {
          size: 123,
          type: "text/plain",
        },
      };

      await adapter.putMetadata(metadata);
      const retrieved = await adapter.getMetadata("test-metadata");

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
        commit_hash: "test-commit",
      };

      await adapter.updateRef(ref.name, ref.commit_hash);
      const retrieved = await adapter.getRef(ref.name);

      expect(retrieved).toEqual(ref);
    });

    it("should list all refs", async () => {
      const refs: IRef[] = [
        { name: "refs/heads/main", commit_hash: "commit1" },
        { name: "refs/heads/feature", commit_hash: "commit2" },
      ];

      for (const ref of refs) {
        await adapter.updateRef(ref.name, ref.commit_hash);
      }

      const retrieved = await adapter.listRefs();
      expect(retrieved).toHaveLength(2);
      expect(retrieved).toEqual(expect.arrayContaining(refs));
    });

    it("should return null for non-existent refs", async () => {
      const retrieved = await adapter.getRef("non-existent");
      expect(retrieved).toBeNull();
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
  });
});
