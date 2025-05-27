- **"Patched base on revision diff" (Object Transfer)**:
  - The "diff" is the set of objects (commits, trees, blobs, metadata) that one peer has and the other needs. The system identifies these objects by traversing the commit graph from known common ancestors.
    Given - Client, Server have a local Storage - Client is point to head at `fromCommitHash`. Want to cachup server at `toCommitHash` - Client make a request to server with `fromCommitHash` -> Diff Object -> then apply update locally
    Process - Depth first search traversed from `toCommitHash` -> `fromCommitHash`. Along with this gather info - Stop traversing when `fromCommitHash` is reached - Collect all objects (commits, trees, blobs, metadata) along the path - Return a sorted array of commits and a map of all necessary objects
    Input - fromCommitHash: string (the starting commit hash) - toCommitHash: string (the target commit hash) - storage: IStorageAdapter (the storage adapter to use for object retrieval) - maxDepth: number (optional, default 1000, prevents stack overflow)
    Output - DiffResult {
    commitChains: string[]; // Sorted array of commit hashes from fromCommitHash to toCommitHash
    objects: {
    commits: Record<string, ICommit>;
    blobs: Record<string, IBlob>;
    trees: Record<string, ITree>;
    metadata: Record<string, IMetadata>;
    }
    }
    Error Cases - Commit not found: When either fromCommitHash or toCommitHash doesn't exist - Tree not found: When a tree referenced by a commit doesn't exist - Blob not found: When a blob referenced by a tree doesn't exist - Metadata not found: When metadata referenced by a tree doesn't exist - Maximum depth exceeded: When the commit chain is too long (prevents stack overflow)
