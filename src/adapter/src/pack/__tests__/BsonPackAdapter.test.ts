import { describe, it, expect } from "vitest";
import { BsonPackAdapter } from "../BsonPackAdapter";
import type { IMetadata, IPackObject } from "@gitblobsdb/interface";

describe("BsonPackAdapter", () => {
  const adapter = new BsonPackAdapter();

  describe("packObjects and unpackObjects", () => {
    it("should pack and unpack a complete set of Git objects", () => {
      // Create test data
      const testData: IPackObject = {
        commits: [
          {
            type: "commit",
            hash: "commit1",
            content: {
              tree_hash: "tree1",
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
          },
        ],
        trees: [
          {
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
          },
        ],
        blobs: [
          {
            type: "blob",
            hash: "blob1",
            content: {
              data: new Uint8Array([1, 2, 3]),
            },
          },
        ],
        metadata: [
          {
            type: "metadata",
            hash: "meta1",
            content: {
              data: {
                size: 3,
                type: "text/plain",
              },
            },
          },
        ],
        _header: {
          version: "1.0",
          timestamp: "2024-03-20T12:00:00Z",
          others: {
            a: "b",
            c: "d",
          },
        },
      };

      // Pack the objects
      const packed = adapter.packObjects(testData);

      // Verify packed data is a Uint8Array
      expect(packed.data).toBeInstanceOf(Uint8Array);
      expect(packed.data.length).toBeGreaterThan(0);

      // Unpack the data
      const unpacked = adapter.unpackObjects(packed.data);

      // Verify unpacked data matches original
      expect(unpacked.commits).toEqual(testData.commits);
      expect(unpacked.trees).toEqual(testData.trees);
      expect(unpacked.blobs).toEqual(testData.blobs);
      expect(unpacked.metadata).toEqual(testData.metadata);
      expect(unpacked._header).toEqual(testData._header);
    });

    it("should handle empty object collections", () => {
      const emptyData: IPackObject = {
        commits: [],
        trees: [],
        blobs: [],
        metadata: [],
        _header: {
          version: "1.0",
          timestamp: "2024-03-20T12:00:00Z",
        },
      };

      const packed = adapter.packObjects(emptyData);
      const unpacked = adapter.unpackObjects(packed.data);

      expect(unpacked.commits).toEqual([]);
      expect(unpacked.trees).toEqual([]);
      expect(unpacked.blobs).toEqual([]);
      expect(unpacked.metadata).toEqual([]);
      expect(unpacked._header).toEqual(emptyData._header);
    });

    it("should handle large binary content in blobs", () => {
      // Create a large binary content (1MB)
      const largeContent = new Uint8Array(1024 * 1024);
      for (let i = 0; i < largeContent.length; i++) {
        largeContent[i] = i % 256;
      }

      const testData: IPackObject = {
        commits: [],
        trees: [],
        blobs: [
          {
            type: "blob",
            hash: "large-blob",
            content: { data: largeContent },
          },
        ],
        metadata: [],
        _header: {
          version: "1.0",
          timestamp: "2024-03-20T12:00:00Z",
        },
      };

      const packed = adapter.packObjects(testData);
      const unpacked = adapter.unpackObjects(packed.data);

      expect(unpacked.blobs[0].content.data).toEqual(largeContent);
    });

    it("should preserve complex metadata structures", () => {
      const complexMetadata: IMetadata = {
        type: "metadata",
        hash: "complex-meta",
        content: {
          data: {
            nested: {
              array: [1, 2, 3],
              object: {
                key: "value",
                number: 42,
                boolean: true,
                null: null,
              },
            },
            array: ["string", 123, true, null],
          },
        },
      };

      const testData: IPackObject = {
        commits: [],
        trees: [],
        blobs: [],
        metadata: [complexMetadata],
        _header: {
          version: "1.0",
          timestamp: "2024-03-20T12:00:00Z",
        },
      };

      const packed = adapter.packObjects(testData);
      const unpacked = adapter.unpackObjects(packed.data);

      expect(unpacked.metadata[0].content.data).toEqual(
        complexMetadata.content.data
      );
      expect(testData._header).toEqual(unpacked._header);
    });
  });
});
