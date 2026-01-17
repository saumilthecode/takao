# 🎯 TAKOA - Social Space Matching Platform

> University friend-matching app with 3D vector visualization, HNSW search, and self-optimizing index tuning.

## 🚀 Quick Start

```bash
# 1. Copy environment file and add your OpenAI key
cp .env.example .env
# Then edit .env and add your OPENAI_API_KEY

# 2. Install & run backend
cd backend
npm install
npm run dev

# 3. Install & run frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
takoa/
├── .env.example          ← COPY THIS TO .env AND EDIT
├── backend/              ← Fastify + TypeScript API
│   └── src/
│       ├── index.ts      ← Server entry point
│       ├── routes/       ← API endpoints
│       └── services/     ← Business logic (HNSW, UMAP, etc.)
└── frontend/             ← Next.js + shadcn/ui
    ├── app/              ← Pages
    └── components/       ← React components
```

## 🔑 API Keys Needed

| Key | Required | Get From |
|-----|----------|----------|
| `OPENAI_API_KEY` | ✅ Yes | https://platform.openai.com/api-keys |

## 🎬 Demo Features

1. **Chat Onboarding** - LLM extracts personality traits
2. **3D Social Graph** - react-force-graph-3d visualization
3. **Match Explainer** - Why two people are matched
4. **Embedding Toggle** - Force view ↔ UMAP view
5. **Index Tuner** - Self-optimizing HNSW parameters

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, shadcn/ui, react-force-graph-3d, recharts
- **Backend**: Fastify, TypeScript, hnswlib-node, density-clustering, umap-js
- **LLM**: OpenAI GPT-4

## 🤖 Ralph - Autonomous Development

Ralph is set up for autonomous development of the graph visualization features.

**Quick Start:**
```bash
# Run Ralph to implement PRD stories automatically
./scripts/ralph/ralph.sh [max_iterations]
```

See `RALPH_SETUP.md` for detailed instructions.

**Current PRD:** `prd.json` contains 6 user stories for:
- 3D graph visualization with ForceGraph3D
- Hover tooltips (name, age, uni)
- Click interactions (highlight edges, show top matches)
- Match explanation panel (similarity scores + top dimensions)
- Chat integration (graph refresh on updates)