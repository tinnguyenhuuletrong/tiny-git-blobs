# GitBlobsDB

A NoSQL database system with Git-like versioning features.

## Features

- Branching and merging
- Storage of data as immutable blob objects + versioned JSON metadata
- Revision control (commits, history traversal, revert concepts)
- Git-inspired API (`/fetch`, `/push`, `/pull`, `/blob/:hash`)
- Local-first operations
- Synchronization via exchanging necessary objects

## Project Structure

```
/src/
├── cores/               # Platform-agnostic core logic (TS)
├── interface/           # Shared TypeScript interfaces & types
├── adapter/             # Interface implementations
├── server/              # Bun server application
└── client-web/          # React client application
└── cli/                 # Cli application
```

## CLI Modules

The CLI modules provide a command-line interface for interacting with the GitBlobsDB. You can perform various operations directly from the terminal, such as:

- **Initialize a new database**: Set up a new instance of GitBlobsDB.
- **Fetch data**: Retrieve data from the database.

### Usage

To use the CLI, navigate to the project directory and run:

```bash
bun run cli --storagePath <path to storage folder>
```

### Available Commands

- **help**: Display available commands and their usage.
- **head**: Fetch and display the current head commit.
- **add [fileName] [fileContent]**: Add a new file with the specified content.
- **getBlob [blobHash]**: Retrieve and display the content of a blob by its hash.
- **history**: Display the commit history.
- **snapshot [--save] [commitHash]**: Retrieve repository state at specific commit (defaults to head if not provided) - Added flag option
- **diff [--save] [fromCommitHash] [toCommitHash]**: Generate diff package update data from fromCommitHash to toCommitHash (default fromCommitHash is head).
- **export [path]**: Export the entire storage to a binary file (default path is ./backup.bin).
- **import [importPath]**: Import a backup from the specified path.
- **applyDiff [diffPath]**: Apply a diff from the specified path (output from Command.Diff).

## Development Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Build all packages:

   ```bash
   bun run build
   ```

3. Run tests:

   ```bash
   bun run test
   ```

4. Start development servers:

   ```bash
   # Start both server and client
   bun run dev

   # Or start them individually:
   bun run --cwd src/server dev
   bun run --cwd src/client-web dev
   ```

## Technology Stack

- TypeScript
- Bun (Runtime & Package Manager)
- React (Client)
- Vitest (Testing)
- Vite (Client Build)
