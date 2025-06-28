# Phase 2 Planning: Cloudflare Relay Server for GitBlobsDB Sync

This document outlines the step-by-step plan to implement a Cloudflare Worker-based WebSocket relay server with temporary data sync using Cloudflare D1 (SQLite) and simple authentication for CLI and web clients.

---

## Step 1: Project Setup

- [ ] Create a new Cloudflare Worker project using Wrangler.
- [ ] Set up Cloudflare D1 (SQLite) database for temporary data storage.
- [ ] Configure environment variables for secrets (e.g., JWT secret).

---

## Step 2: Database Schema Design

- [ ] Design D1 tables for:
  - Users (id, username, password hash, created_at)
  - Sessions (id, user_id, token, expires_at)
  - SyncData (id, user_id, data_type, data, created_at, expires_at)
- [ ] Write migration scripts for schema initialization.

---

## Step 3: Authentication Endpoints

- [ ] Implement `POST /login` endpoint:
  - Accepts username/password.
  - Verifies credentials and returns a signed session token (JWT or similar).
- [ ] Implement session validation middleware for protected endpoints.

---

## Step 4: WebSocket Relay Endpoint

- [ ] Implement `GET /ws` endpoint:
  - Accepts WebSocket upgrade with session token.
  - Authenticates client before upgrading connection.
  - Manages connected clients and relays messages between them.
- [ ] Ensure only authenticated clients can send/receive data.

---

## Step 5: Data Sync Logic

- [ ] Implement logic to temporarily store incoming sync data in D1.
- [ ] Allow clients to push blobs/commits and retrieve them as needed.
- [ ] Implement TTL (time-to-live) for automatic cleanup of old sync data.

---

## Step 6: CLI and Web Client Integration

- [ ] Update CLI to support login and WebSocket sync with session token.
- [ ] Update web client to support login and WebSocket sync.
- [ ] Ensure both clients can push/pull data via the relay server.

---

## Step 7: Security and Testing

- [ ] Enforce HTTPS and secure token handling.
- [ ] Write unit and integration tests for authentication, relay, and data sync.
- [ ] Test with multiple clients for correct data delivery and isolation.

---

## Step 8: Deployment and Monitoring

- [ ] Deploy Worker and D1 to Cloudflare.
- [ ] Set up monitoring/logging for connections and errors.
- [ ] Document usage and update project README.

---

## Optional Enhancements

- [ ] Add admin endpoints for user management and data cleanup.
- [ ] Implement rate limiting and abuse prevention.
- [ ] Add support for additional sync features as needed.

---