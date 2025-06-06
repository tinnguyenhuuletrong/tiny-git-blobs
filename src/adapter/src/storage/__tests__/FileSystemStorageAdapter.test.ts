import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FileSystemStorageAdapter } from "../FileSystemStorageAdapter";
import { join } from "path";
import { mkdir, rm } from "fs/promises";
import { createBlob } from "@gitblobsdb/cores/src/objects/create";
import { ICommit, IMetadata, ITree } from "@gitblobsdb/interface";

describe("FileSystemStorageAdapter", () => {
  const TEST_DIR = join(process.cwd(), "_tmp/test-storage");
  let adapter: FileSystemStorageAdapter;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    adapter = new FileSystemStorageAdapter(TEST_DIR);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("Blob operations", () => {
    it("should store and retrieve a blob", async () => {
      const content = new TextEncoder().encode("test content");
      const blob = createBlob(content);

      await adapter.putBlob(blob);
      const retrieved = await adapter.getBlob(blob.hash);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.hash).toBe(blob.hash);
      expect(retrieved?.content.data).toEqual(content);
    });

    it("should return null for non-existent blob", async () => {
      const retrieved = await adapter.getBlob("nonexistent");
      expect(retrieved).toBeNull();
    });
  });

  describe("Tree operations", () => {
    it("should store and retrieve a tree", async () => {
      const tree: ITree = {
        type: "tree",
        hash: "test-tree-hash",
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

      await adapter.putTree(tree);
      const retrieved = await adapter.getTree(tree.hash);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.hash).toBe(tree.hash);
      expect(retrieved?.content.entries).toEqual(tree.content.entries);
    });
  });

  describe("Commit operations", () => {
    it("should store and retrieve a commit", async () => {
      const commit: ICommit = {
        type: "commit",
        hash: "test-commit-hash",
        content: {
          tree_hash: "test-tree-hash",
          parent_hashes: ["parent1", "parent2"],
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
          message: "Test commit message",
        },
      };

      await adapter.putCommit(commit);
      const retrieved = await adapter.getCommit(commit.hash);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.hash).toBe(commit.hash);
      expect(retrieved?.content.tree_hash).toBe(commit.content.tree_hash);
      expect(retrieved?.content.parent_hashes).toEqual(
        commit.content.parent_hashes
      );
      expect(retrieved?.content.author).toEqual(commit.content.author);
      expect(retrieved?.content.committer).toEqual(commit.content.committer);
      expect(retrieved?.content.message).toBe(commit.content.message);
    });
  });

  describe("Metadata operations", () => {
    it("should store and retrieve metadata", async () => {
      const metadata: IMetadata = {
        type: "metadata",
        hash: "test-metadata-hash",
        content: {
          data: {
            key1: "value1",
            key2: 123,
            key3: { nested: "value" },
          },
        },
      };

      await adapter.putMetadata(metadata);
      const retrieved = await adapter.getMetadata(metadata.hash);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.hash).toBe(metadata.hash);
      expect(retrieved?.content.data).toEqual(metadata.content.data);
    });
  });

  describe("Ref operations", () => {
    it("should store and retrieve a ref", async () => {
      const refName = "main";
      const commitHash = "test-commit-hash";

      await adapter.updateRef(refName, commitHash);
      const retrieved = await adapter.getRef(refName);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe(refName);
      expect(retrieved?.commit_hash).toBe(commitHash);
    });

    it("should list refs", async () => {
      await adapter.updateRef("main", "main-hash");
      await adapter.updateRef("feature", "feature-hash");

      const refs = await adapter.listRefs();
      expect(refs).toHaveLength(2);
      expect(refs.map((r) => r.name)).toContain("main");
      expect(refs.map((r) => r.name)).toContain("feature");
    });
  });

  describe("HEAD operations", () => {
    it("should store and retrieve HEAD pointing to a ref", async () => {
      const head = {
        type: "ref" as const,
        value: "refs/heads/main",
      };

      await adapter.setHead(head);
      const retrieved = await adapter.getHead();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.type).toBe("ref");
      expect(retrieved?.value).toBe("refs/heads/main");
    });

    it("should store and retrieve HEAD pointing to a commit", async () => {
      const head = {
        type: "commit" as const,
        value: "test-commit-hash",
      };

      await adapter.setHead(head);
      const retrieved = await adapter.getHead();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.type).toBe("commit");
      expect(retrieved?.value).toBe("test-commit-hash");
    });
  });

  describe("Object operations", () => {
    it("should check if an object exists", async () => {
      const content = new TextEncoder().encode("test content");
      const blob = createBlob(content);

      await adapter.putBlob(blob);
      expect(await adapter.hasObject(blob.hash)).toBe(true);
      expect(await adapter.hasObject("nonexistent")).toBe(false);
    });

    it("should delete an object", async () => {
      const content = new TextEncoder().encode("test content");
      const blob = createBlob(content);

      await adapter.putBlob(blob);
      expect(await adapter.hasObject(blob.hash)).toBe(true);

      await adapter.deleteObject(blob.hash);
      expect(await adapter.hasObject(blob.hash)).toBe(false);
    });
  });
});
