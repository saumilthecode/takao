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

# 2. Install dependencies
npm install

# 3. Start the API server
npm run dev
# API runs on http://localhost:4000
```

### Quick Test

```bash
# Test API health
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":...}

# Test chat endpoint
curl -X POST http://localhost:4000/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","message":"Hello!","history":[]}'
```

## 📁 Project Structure

```
takoa/
├── .env                  ← Your OpenAI API key (create this)
├── src/                  ← Fastify + TypeScript API (port 4000)
│   ├── index.ts          ← Server entry point
│   ├── routes/           ← API endpoints (/chat, /graph, /tuner)
│   ├── services/         ← Business logic (HNSW, UMAP, LLM)
│   └── data/             ← Seed data and user management
├── scripts/ralph/        ← Ralph automation scripts
└── prd.json              ← Product requirements document
```

## 🛠️ Development Commands

```bash
npm run dev               # Start API dev server with hot reload
npm run build             # Build TypeScript to dist/
npm start                 # Run production build
npm test                  # Run tests (health check)
```

## 📡 API Endpoints

- `GET /health` - Health check
- `POST /chat` - Chat with onboarding bot
  ```json
  {
    "userId": "string",
    "message": "string",
    "history": [{"role": "user|assistant", "content": "string"}]
  }
  ```
- `GET /graph` - Get social graph data
- `GET /graph/match/:id1/:id2` - Get match explanation
- `GET /tuner/benchmark` - Get index tuner results

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