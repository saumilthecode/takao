# AGENTS.md - Project Patterns & Learnings

This file documents patterns, conventions, and gotchas discovered during development. Ralph and other agents automatically read this file for context.

## Project Overview

Takoa is a university friend-matching app with:
- **Backend**: Fastify + TypeScript (port 4000)
- **Frontend**: Next.js 14 + TypeScript (port 3000)
- **3D Visualization**: react-force-graph-3d
- **Vector Search**: HNSW via hnswlib-node
- **LLM**: OpenAI GPT-4 for chat onboarding

## Code Patterns

### Backend Routes
- Routes are in `backend/src/routes/`
- Use Fastify instance registration pattern
- All routes return JSON
- Error handling: return `reply.status(500).send({ error: '...' })`

### Frontend Components
- Components in `frontend/components/`
- Use shadcn/ui components from `components/ui/`
- Client components use `'use client'` directive
- API calls via `lib/api.ts`

### Graph Data Structure
- Nodes have: `id`, `name`, `age`, `uni`, `x`, `y`, `z`, `clusterId`, `vector`, `traits`, `interests`
- Links have: `source`, `target`, `strength`
- Graph endpoint: `GET /graph?mode=force|embedding&k=5`

### Vector Operations
- Vectors are arrays of numbers (personality traits + interests)
- Cosine similarity used for matching
- Vector store in `services/vectorStore.ts`

## Gotchas

- **CORS**: Backend allows `http://localhost:3000` and `http://127.0.0.1:3000`
- **Environment**: `.env` file should be in project root (not backend/)
- **TypeScript**: Both backend and frontend use strict mode
- **Ports**: Backend 4000, Frontend 3000 (hardcoded in some places)

## Future Enhancements

- UMAP embedding view toggle (after MVP)
- Index tuner dashboard (after MVP)
- Real-time graph updates via WebSocket (optional)
