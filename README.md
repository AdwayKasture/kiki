# kiki

A tool for building, analyzing, and improving AI agent skills.

## Overview

This project is a **skill builder for AI agents**. It provides an interface to inspect agent sessions, discover reusable patterns, and turn those patterns into testable, reusable skills.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Elixir, Phoenix (API mode), Ecto, PostgreSQL

## Project Layout

```
kiki/
├── frontend/          # React + Vite SPA
├── backend/           # Phoenix API
└── docker-compose.yml # local PostgreSQL (optional)
```

## Development

### Requirements

- [Elixir](https://elixir-lang.org/install.html) 1.17+
- [Bun](https://bun.sh/) (or Node + npm)
- PostgreSQL 14+ (or Docker)

### Setup

From the `backend/` directory:

```bash
cd backend
mix setup
```

This installs Elixir dependencies, creates the development database, and installs frontend packages.

### Running the App

Start the backend and frontend in separate terminals:

```bash
# Terminal 1
cd backend
mix phx.server

# Terminal 2
cd frontend
bun run dev
```

The Vite dev server proxies `/api` requests to Phoenix on `http://localhost:4000`, so the frontend can call the API at `/api`.

### Running Tests

```bash
# Backend
cd backend
mix test

# Frontend
cd frontend
bun test
```

## Production Build

Build the frontend and copy the static assets into the Phoenix app:

```bash
cd backend
mix assets.deploy
PHX_SERVER=true mix phx.server
```

Phoenix serves the built SPA at `/` and API routes under `/api`.
