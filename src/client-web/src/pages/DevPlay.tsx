import DiffViewer from "@/components/DiffViewer";
import type { DiffResult } from "@gitblobsdb/cores/src/versioning/diff";

// Sample data for demonstration
const sampleDiffResult = {
  commitChains: [
    "8a7d3c1e5f2b9a0d6c4e7f8a1b2c3d4e5f6a7b8",
    "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
    "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
  ],
  objects: {
    commits: {
      "8a7d3c1e5f2b9a0d6c4e7f8a1b2c3d4e5f6a7b8": {
        type: "commit",
        hash: "8a7d3c1e5f2b9a0d6c4e7f8a1b2c3d4e5f6a7b8",
        content: {
          tree_hash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
          parent_hashes: [],
          author: {
            name: "John Doe",
            email: "john@example.com",
            timestamp: "2023-06-10T12:00:00Z",
          },
          committer: {
            name: "John Doe",
            email: "john@example.com",
            timestamp: "2023-06-10T12:00:00Z",
          },
          message: "Initial commit",
        },
      },
      "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1": {
        type: "commit",
        hash: "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1",
        content: {
          tree_hash: "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
          parent_hashes: ["8a7d3c1e5f2b9a0d6c4e7f8a1b2c3d4e5f6a7b8"],
          author: {
            name: "Jane Smith",
            email: "jane@example.com",
            timestamp: "2023-06-11T14:30:00Z",
          },
          committer: {
            name: "Jane Smith",
            email: "jane@example.com",
            timestamp: "2023-06-11T14:30:00Z",
          },
          message: "Add README and configuration files",
        },
      },
      "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2": {
        type: "commit",
        hash: "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
        content: {
          tree_hash: "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
          parent_hashes: ["2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1"],
          author: {
            name: "Alex Johnson",
            email: "alex@example.com",
            timestamp: "2023-06-12T09:15:00Z",
          },
          committer: {
            name: "Alex Johnson",
            email: "alex@example.com",
            timestamp: "2023-06-12T09:15:00Z",
          },
          message: "Implement core functionality",
        },
      },
    },
    trees: {
      "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0": {
        type: "tree",
        hash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
        content: {
          entries: {
            "package.json": {
              blob_hash: "1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a",
              metadata_hash: "1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m",
              type: "file",
            },
          },
        },
      },
      "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b": {
        type: "tree",
        hash: "2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
        content: {
          entries: {
            "package.json": {
              blob_hash: "1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a",
              metadata_hash: "1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m",
              type: "file",
            },
            "README.md": {
              blob_hash: "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a",
              metadata_hash: "2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m",
              type: "file",
            },
            "config.json": {
              blob_hash: "3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a",
              metadata_hash: "3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m",
              type: "file",
            },
          },
        },
      },
      "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c": {
        type: "tree",
        hash: "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
        content: {
          entries: {
            "package.json": {
              blob_hash: "4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a",
              metadata_hash: "4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m",
              type: "file",
            },
            "README.md": {
              blob_hash: "5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a",
              metadata_hash: "5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m",
              type: "file",
            },
            "config.json": {
              blob_hash: "6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a",
              metadata_hash: "6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m",
              type: "file",
            },
            "src/index.js": {
              blob_hash: "7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a",
              metadata_hash: "7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m",
              type: "file",
            },
            "src/utils/helpers.js": {
              blob_hash: "8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a",
              metadata_hash: "8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m",
              type: "file",
            },
          },
        },
      },
    },
    blobs: {
      "1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a": {
        type: "blob",
        hash: "1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a",
        content: {
          data: new TextEncoder().encode(
            '{\n  "name": "project",\n  "version": "0.1.0"\n}'
          ),
        },
      },
      "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a": {
        type: "blob",
        hash: "2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a",
        content: {
          data: new TextEncoder().encode(
            "# Project\n\nThis is a sample project."
          ),
        },
      },
      "3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a": {
        type: "blob",
        hash: "3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a3a",
        content: {
          data: new TextEncoder().encode(
            '{\n  "debug": true,\n  "port": 3000\n}'
          ),
        },
      },
      "4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a": {
        type: "blob",
        hash: "4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a",
        content: {
          data: new TextEncoder().encode(
            '{\n  "name": "project",\n  "version": "0.2.0",\n  "dependencies": {\n    "express": "^4.17.1"\n  }\n}'
          ),
        },
      },
      "5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a": {
        type: "blob",
        hash: "5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a",
        content: {
          data: new TextEncoder().encode(
            "# Project\n\nThis is a sample project with core functionality implemented."
          ),
        },
      },
      "6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a": {
        type: "blob",
        hash: "6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a6a",
        content: {
          data: new TextEncoder().encode(
            '{\n  "debug": false,\n  "port": 3000,\n  "logLevel": "info"\n}'
          ),
        },
      },
      "7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a": {
        type: "blob",
        hash: "7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a",
        content: {
          data: new TextEncoder().encode(
            'const express = require("express");\nconst app = express();\nconst config = require("../config.json");\nconst { formatResponse } = require("./utils/helpers");\n\napp.get("/", (req, res) => {\n  res.json(formatResponse({ message: "Hello World" }));\n});\n\napp.listen(config.port, () => {\n  console.log(`Server running on port ${config.port}`);\n});'
          ),
        },
      },
      "8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a": {
        type: "blob",
        hash: "8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a",
        content: {
          data: new TextEncoder().encode(
            "/**\n * Format API response\n * @param {Object} data - Response data\n * @returns {Object} Formatted response\n */\nexports.formatResponse = (data) => {\n  return {\n    success: true,\n    timestamp: new Date().toISOString(),\n    data\n  };\n};"
          ),
        },
      },
    },
    metadata: {
      "1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m": {
        type: "metadata",
        hash: "1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m1m",
        content: {
          data: {
            createdAt: "2023-06-10T12:00:00Z",
            size: 42,
            mimeType: "application/json",
          },
        },
      },
      "2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m": {
        type: "metadata",
        hash: "2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m2m",
        content: {
          data: {
            createdAt: "2023-06-11T14:30:00Z",
            size: 35,
            mimeType: "text/markdown",
          },
        },
      },
      "3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m": {
        type: "metadata",
        hash: "3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m3m",
        content: {
          data: {
            createdAt: "2023-06-11T14:35:00Z",
            size: 38,
            mimeType: "application/json",
          },
        },
      },
      "4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m": {
        type: "metadata",
        hash: "4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m4m",
        content: {
          data: {
            createdAt: "2023-06-12T09:10:00Z",
            size: 95,
            mimeType: "application/json",
          },
        },
      },
      "5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m": {
        type: "metadata",
        hash: "5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m5m",
        content: {
          data: {
            createdAt: "2023-06-12T09:12:00Z",
            size: 62,
            mimeType: "text/markdown",
          },
        },
      },
      "6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m": {
        type: "metadata",
        hash: "6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m6m",
        content: {
          data: {
            createdAt: "2023-06-12T09:13:00Z",
            size: 55,
            mimeType: "application/json",
          },
        },
      },
      "7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m": {
        type: "metadata",
        hash: "7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m7m",
        content: {
          data: {
            createdAt: "2023-06-12T09:14:00Z",
            size: 320,
            mimeType: "application/javascript",
          },
        },
      },
      "8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m": {
        type: "metadata",
        hash: "8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m8m",
        content: {
          data: {
            createdAt: "2023-06-12T09:15:00Z",
            size: 210,
            mimeType: "application/javascript",
          },
        },
      },
    },
  },
} as DiffResult;

export default function DemoPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">DiffResult Viewer Demo</h1>
      <DiffViewer diffResult={sampleDiffResult} />
    </div>
  );
}
