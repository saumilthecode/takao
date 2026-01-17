# 🎯 TAKOA - Social Space Matching Platform

> University friend-matching app with 3D vector visualization, HNSW search, and self-optimizing index tuning.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Setup

```bash
# 1. Set up environment
# Create .env file in project root with your OpenAI key:
echo "openaikey=your-api-key-here" > .env

# 2. Install dependencies (all in one command)
npm install
```

### Run the Application

Open two terminal windows/tabs:

**Terminal 1 - API Backend:**
```bash
npm run dev:api
# Backend runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

Then open http://localhost:3000 in your browser.

### Quick Test

```bash
# Test backend health
curl http://localhost:4000/health

# Should return: {"status":"ok","timestamp":...}
```

## 📁 Project Structure

```
takoa/
├── .env                  ← Your OpenAI API key (create this)
├── src/                  ← Fastify + TypeScript API (port 4000)
│   ├── index.ts          ← Server entry point
│   ├── routes/           ← API endpoints (/chat, /graph, /tuner)
│   └── services/         ← Business logic (HNSW, UMAP, LLM)
├── app/                  ← Next.js pages (port 3000)
├── components/           ← React components
├── lib/                  ← Shared utilities
├── scripts/ralph/        ← Ralph automation scripts
└── prd.json              ← Product requirements document
```

## 🛠️ Development Commands

```bash
# Frontend (Next.js)
npm run dev               # Start Next.js dev server
npm run build             # Build for production
npm start                 # Run production build
npm run lint              # Run ESLint

# API Backend (Fastify)
npm run dev:api           # Start API dev server with hot reload
npm run build:api         # Build TypeScript to dist/
npm run start:api         # Run production build
```

## 🔑 Environment Setup

Create a `.env` file in the project root:

```bash
openaikey=sk-your-openai-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

**Note:** The key is named `openaikey` (not `OPENAI_API_KEY`) to match your setup.

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