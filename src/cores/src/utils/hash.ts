import { createHash } from "crypto";

/**
 * Calculate SHA-256 hash of binary data
 */
export function hashBinary(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Calculate SHA-256 hash of a JSON object
 * The object is first converted to a canonical JSON string
 */
export function hashObject(obj: Record<string, any>): string {
  const canonicalObj = Object.fromEntries(
    Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0]))
  );
  const canonicalJson = JSON.stringify(canonicalObj);
  return createHash("sha256").update(canonicalJson).digest("hex");
}

/**
 * Calculate hash of a blob object
 */
export function hashBlob(content: Uint8Array): string {
  return hashBinary(content);
}

/**
 * Calculate hash of a tree object
 */
export function hashTree(entries: Record<string, any>): string {
  return hashObject(entries);
}

/**
 * Calculate hash of a commit object
 */
export function hashCommit(commit: {
  tree_hash: string;
  parent_hashes: string[];
  author: { name: string; email: string; timestamp: string };
  committer: { name: string; email: string; timestamp: string };
  message: string;
}): string {
  return hashObject(commit);
}

/**
 * Calculate hash of a metadata object
 */
export function hashMetadata(data: Record<string, any>): string {
  return hashObject(data);
}
