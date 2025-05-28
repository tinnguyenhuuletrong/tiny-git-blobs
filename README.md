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
├── cores/                 # Platform-agnostic core logic (TS)
├── interface/            # Shared TypeScript interfaces & types
├── adapter/              # Interface implementations
├── server/              # Bun server application
└── client-web/          # React client application
└── cli/                 # Cli application
```

## CLI Modules

The CLI modules provide a command-line interface for interacting with the GitBlobsDB. You can perform various operations directly from the terminal, such as:

- **Initialize a new database**: Set up a new instance of GitBlobsDB.
- **Fetch data**: Retrieve data from the database.
- **Push changes**: Save changes to the database.
- **Pull updates**: Synchronize your local database with remote changes.

### Usage

To use the CLI, navigate to the project directory and run:

```bash
bun run cli [command] [options]
```

Replace `[command]` with the desired operation (e.g., `init`, `fetch`, `push`, `pull`) and `[options]` with any necessary parameters.

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
