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
```

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
