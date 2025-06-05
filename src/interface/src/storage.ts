import type {
  IBlob,
  ICommit,
  IHead,
  IMetadata,
  IObject,
  IRef,
  ITree,
} from "./objects";

/**
 * Storage adapter interface for GitBlobsDB
 * This interface defines the contract for storage implementations
 * (e.g., FileSystemStorageAdapter, IndexedDBStorageAdapter)
 */
export interface IStorageAdapter {
  // Object operations
  getObject(hash: string): Promise<IObject | null>;
  putObject(object: IObject): Promise<void>;

  // Specific object type operations
  getBlob(hash: string): Promise<IBlob | null>;
  putBlob(blob: IBlob): Promise<void>;

  getTree(hash: string): Promise<ITree | null>;
  putTree(tree: ITree): Promise<void>;

  getCommit(hash: string): Promise<ICommit | null>;
  putCommit(commit: ICommit): Promise<void>;

  getMetadata(hash: string): Promise<IMetadata | null>;
  putMetadata(metadata: IMetadata): Promise<void>;

  // Reference operations
  getRef(name: string): Promise<IRef | null>;
  updateRef(name: string, commitHash: string): Promise<void>;
  listRefs(): Promise<IRef[]>;

  // HEAD operations
  getHead(): Promise<IHead | null>;
  setHead(head: IHead): Promise<void>;

  // Utility operations
  hasObject(hash: string): Promise<boolean>;
  deleteObject(hash: string): Promise<void>;

  // Optional extension interface for advanced storage operations
  asStorageExt?(): IStorageAdapterEx | null;
}

// Extension interface for advanced storage operations like object scanning
export interface IStorageAdapterEx {
  scanObject(): AsyncGenerator<IObject>;
}
