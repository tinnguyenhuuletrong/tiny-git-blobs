import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FileSystemStorageAdapter } from "../FileSystemStorageAdapter";
import { join } from "path";
import { mkdir, rm } from "fs/promises";
import {
  createBlob,
  createTree,
  createCommit,
  createMetadata,
} from "@gitblobsdb/cores/src/objects/create";
import { IObject, IPackObject } from "@gitblobsdb/interface";

describe("FileSystemStorageAdapter Integration", () => {
  const TEST_DIR = join(process.cwd(), "_tmp/test-storage-integration");
  let adapter: FileSystemStorageAdapter;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    adapter = new FileSystemStorageAdapter(TEST_DIR);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should handle a complete commit workflow", async () => {
    // 1. Create and store a blob
    const content = new TextEncoder().encode("Hello, World!");
    const blob = createBlob(content);
    await adapter.putBlob(blob);

    // 2. Create and store metadata for the blob
    const metadata = createMetadata({
      filename: "hello.txt",
      size: content.length,
      mimeType: "text/plain",
    });
    await adapter.putMetadata(metadata);

    // 3. Create and store a tree referencing the blob and metadata
    const tree = createTree({
      "hello.txt": {
        blob_hash: blob.hash,
        metadata_hash: metadata.hash,
        type: "file",
      },
    });
    await adapter.putTree(tree);

    // 4. Create and store a commit referencing the tree
    const commit = createCommit({
      tree_hash: tree.hash,
      parent_hashes: [], // Initial commit
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
      message: "Initial commit",
    });
    await adapter.putCommit(commit);

    // 5. Create a branch pointing to the commit
    await adapter.updateRef("main", commit.hash);

    // 6. Set HEAD to point to the branch
    await adapter.setHead({
      type: "ref",
      value: "main",
    });

    // 7. Verify all objects can be retrieved
    const retrievedBlob = await adapter.getBlob(blob.hash);
    expect(retrievedBlob).not.toBeNull();
    expect(retrievedBlob?.content.data).toEqual(content);

    const retrievedMetadata = await adapter.getMetadata(metadata.hash);
    expect(retrievedMetadata).not.toBeNull();
    expect(retrievedMetadata?.content.data).toEqual(metadata.content.data);

    const retrievedTree = await adapter.getTree(tree.hash);
    expect(retrievedTree).not.toBeNull();
    expect(retrievedTree?.content.entries).toEqual(tree.content.entries);

    const retrievedCommit = await adapter.getCommit(commit.hash);
    expect(retrievedCommit).not.toBeNull();
    expect(retrievedCommit?.content.tree_hash).toBe(tree.hash);
    expect(retrievedCommit?.content.parent_hashes).toEqual([]);

    // 8. Verify refs and HEAD
    const ref = await adapter.getRef("main");
    expect(ref).not.toBeNull();
    expect(ref?.commit_hash).toBe(commit.hash);

    const head = await adapter.getHead();
    expect(head).not.toBeNull();
    expect(head?.type).toBe("ref");
    expect(head?.value).toBe("main");
  });

  it("should handle multiple commits and branches", async () => {
    // 1. Create initial commit
    const initialContent = new TextEncoder().encode("Initial content");
    const initialBlob = createBlob(initialContent);
    const initialMetadata = createMetadata({ filename: "file.txt" });
    const initialTree = createTree({
      "file.txt": {
        blob_hash: initialBlob.hash,
        metadata_hash: initialMetadata.hash,
        type: "file",
      },
    });
    const initialCommit = createCommit({
      tree_hash: initialTree.hash,
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
      message: "Initial commit",
    });

    // Store initial objects
    await adapter.putBlob(initialBlob);
    await adapter.putMetadata(initialMetadata);
    await adapter.putTree(initialTree);
    await adapter.putCommit(initialCommit);
    await adapter.updateRef("main", initialCommit.hash);

    // 2. Create a feature branch
    await adapter.updateRef("feature", initialCommit.hash);

    // 3. Make a commit on the feature branch
    const featureContent = new TextEncoder().encode("Feature content");
    const featureBlob = createBlob(featureContent);
    const featureMetadata = createMetadata({ filename: "feature.txt" });
    const featureTree = createTree({
      "feature.txt": {
        blob_hash: featureBlob.hash,
        metadata_hash: featureMetadata.hash,
        type: "file",
      },
    });
    const featureCommit = createCommit({
      tree_hash: featureTree.hash,
      parent_hashes: [initialCommit.hash],
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
      message: "Feature commit",
    });

    // Store feature objects
    await adapter.putBlob(featureBlob);
    await adapter.putMetadata(featureMetadata);
    await adapter.putTree(featureTree);
    await adapter.putCommit(featureCommit);
    await adapter.updateRef("feature", featureCommit.hash);

    // 4. Switch to feature branch
    await adapter.setHead({
      type: "ref",
      value: "feature",
    });

    // 5. Verify all objects exist
    expect(await adapter.hasObject(initialBlob.hash)).toBe(true);
    expect(await adapter.hasObject(featureBlob.hash)).toBe(true);
    expect(await adapter.hasObject(initialTree.hash)).toBe(true);
    expect(await adapter.hasObject(featureTree.hash)).toBe(true);
    expect(await adapter.hasObject(initialCommit.hash)).toBe(true);
    expect(await adapter.hasObject(featureCommit.hash)).toBe(true);

    // 6. Verify refs
    const refs = await adapter.listRefs();
    expect(refs).toHaveLength(2);

    expect(refs.map((r) => r.name)).toContain("main");
    expect(refs.map((r) => r.name)).toContain("feature");

    // 7. Verify HEAD
    const head = await adapter.getHead();
    expect(head?.type).toBe("ref");
    expect(head?.value).toBe("feature");

    // 8. Verify commit history
    const featureCommitRetrieved = await adapter.getCommit(featureCommit.hash);
    expect(featureCommitRetrieved?.content.parent_hashes).toContain(
      initialCommit.hash
    );
  });

  it("should scan all objects in storage", async () => {
    // 1. Create and store test objects
    const content = new TextEncoder().encode("Test content");
    const blob = createBlob(content);
    const metadata = createMetadata({
      filename: "test.txt",
      size: content.length,
      mimeType: "text/plain",
    });
    const tree = createTree({
      "test.txt": {
        blob_hash: blob.hash,
        metadata_hash: metadata.hash,
        type: "file",
      },
    });
    const commit = createCommit({
      tree_hash: tree.hash,
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
    });

    // Store all objects
    await adapter.putBlob(blob);
    await adapter.putMetadata(metadata);
    await adapter.putTree(tree);
    await adapter.putCommit(commit);

    // 2. Scan objects and collect them
    const scannedObjects = new Map<string, IObject>();
    for await (const obj of adapter.scanObject()) {
      scannedObjects.set(obj.hash, obj);
    }

    // 3. Verify all objects were found
    expect(scannedObjects.size).toBe(4);
    expect(scannedObjects.get(blob.hash)?.type).toBe("blob");
    expect(scannedObjects.get(metadata.hash)?.type).toBe("metadata");
    expect(scannedObjects.get(tree.hash)?.type).toBe("tree");
    expect(scannedObjects.get(commit.hash)?.type).toBe("commit");
  });

  it("should replace storage with snapshot data", async () => {
    // 1. Create initial objects
    const content = new TextEncoder().encode("Initial content");
    const blob = createBlob(content);
    const metadata = createMetadata({
      filename: "test.txt",
      size: content.length,
      mimeType: "text/plain",
    });
    const tree = createTree({
      "test.txt": {
        blob_hash: blob.hash,
        metadata_hash: metadata.hash,
        type: "file",
      },
    });
    const commit = createCommit({
      tree_hash: tree.hash,
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
      message: "Initial commit",
    });

    // 2. Create snapshot data
    const snapshotData: IPackObject = {
      blobs: [blob],
      trees: [tree],
      commits: [commit],
      metadata: [metadata],
      _header: {
        version: "1",
        timestamp: new Date().toString(),
        others: {
          commit_head: commit.hash,
        },
      },
    };

    // 3. Replace storage with snapshot
    await adapter.replaceWithStorageSnapshot(snapshotData);

    // 4. Verify all objects were restored
    const retrievedBlob = await adapter.getBlob(blob.hash);
    expect(retrievedBlob).not.toBeNull();
    expect(retrievedBlob?.content.data).toEqual(content);

    const retrievedMetadata = await adapter.getMetadata(metadata.hash);
    expect(retrievedMetadata).not.toBeNull();
    expect(retrievedMetadata?.content.data).toEqual(metadata.content.data);

    const retrievedTree = await adapter.getTree(tree.hash);
    expect(retrievedTree).not.toBeNull();
    expect(retrievedTree?.content.entries).toEqual(tree.content.entries);

    const retrievedCommit = await adapter.getCommit(commit.hash);
    expect(retrievedCommit).not.toBeNull();
    expect(retrievedCommit?.content.tree_hash).toBe(tree.hash);

    // 5. Verify HEAD was set correctly
    const head = await adapter.getHead();
    expect(head).not.toBeNull();
    expect(head?.type).toBe("commit");
    expect(head?.value).toBe(commit.hash);
  });

  it("should throw error when replacing storage with invalid snapshot data", async () => {
    // Create invalid snapshot data (missing commit_head)
    const invalidSnapshotData: IPackObject = {
      blobs: [],
      trees: [],
      commits: [],
      metadata: [],
      _header: {
        version: "1",
        timestamp: new Date().toString(),
        others: {},
      },
    };

    // Attempt to replace storage with invalid snapshot
    await expect(
      adapter.replaceWithStorageSnapshot(invalidSnapshotData)
    ).rejects.toThrow(
      "snapshotData missing _header.others.commit_head. anything wrong ?"
    );
  });
});
