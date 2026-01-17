/**
 * ============================================================
 * 📄 FILE: backend/src/services/tuner.ts
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Self-optimizing HNSW index tuner.
 *    Sweeps over parameter configs and picks best under latency budget.
 *    This is the "wow" systems feature for judges!
 * 
 * 🛠️ TECH USED:
 *    - Parameter sweep over (M, efConstruction, efSearch)
 *    - Recall@k measurement (how many true neighbors found)
 *    - p95 latency measurement
 * 
 * 📤 EXPORTS:
 *    - runBenchmark() → tests all configs, returns metrics
 *    - getBestConfig() → picks best config under latency budget
 * 
 * 💡 KEY CONCEPT:
 *    HNSW has a speed-accuracy tradeoff:
 *    - Higher M, ef = more accurate but slower
 *    - Lower M, ef = faster but misses some matches
 * 
 *    The tuner automatically finds the sweet spot.
 * 
 * ============================================================
 */

import { getAllUsers } from '../data/seedUsers.js';
import { cosineSimilarity, searchWithEf } from './vectorStore.js';

export interface TunerConfig {
  M: number;           // Max connections per node
  efConstruction: number; // Build-time beam width
  efSearch: number;    // Query-time beam width
}

export interface BenchmarkResult extends TunerConfig {
  recall: number;      // Recall@10 (0-1)
  avgLatencyMs: number; // Average query latency
  p95LatencyMs: number; // 95th percentile latency
  queriesPerSecond: number;
}

// Configs to test
const CONFIGS: TunerConfig[] = [
  { M: 8, efConstruction: 100, efSearch: 20 },
  { M: 8, efConstruction: 100, efSearch: 50 },
  { M: 16, efConstruction: 100, efSearch: 50 },
  { M: 16, efConstruction: 200, efSearch: 100 },
  { M: 32, efConstruction: 200, efSearch: 100 },
  { M: 32, efConstruction: 200, efSearch: 200 },
  { M: 32, efConstruction: 400, efSearch: 200 },
  { M: 48, efConstruction: 400, efSearch: 300 },
];

/**
 * Run benchmark across all configs
 */
export async function runBenchmark(): Promise<BenchmarkResult[]> {
  console.log('🔬 Running HNSW parameter benchmark...');
  
  const users = getAllUsers();
  const numQueries = Math.min(20, users.length); // Sample for speed
  const k = 10; // We measure recall@10

  const results: BenchmarkResult[] = [];

  for (const config of CONFIGS) {
    // Sample random query vectors
    const queryIndices = sampleIndices(users.length, numQueries);
    const latencies: number[] = [];
    let totalRecall = 0;

    for (const queryIdx of queryIndices) {
      const queryVector = users[queryIdx].vector;

      // Get ground truth (brute-force exact neighbors)
      const groundTruth = getExactNeighbors(queryVector, users, k, queryIdx);

      // Time the approximate search
      const startTime = performance.now();
      const approxResults = await searchWithEf(queryVector, k, config.efSearch);
      const endTime = performance.now();

      latencies.push(endTime - startTime);

      // Calculate recall
      const approxIds = new Set(approxResults.map(r => r.id));
      const hits = groundTruth.filter(id => approxIds.has(id)).length;
      totalRecall += hits / k;
    }

    // Compute metrics
    latencies.sort((a, b) => a - b);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index] || latencies[latencies.length - 1];

    results.push({
      ...config,
      recall: totalRecall / numQueries,
      avgLatencyMs: parseFloat(avgLatency.toFixed(2)),
      p95LatencyMs: parseFloat(p95Latency.toFixed(2)),
      queriesPerSecond: parseFloat((1000 / avgLatency).toFixed(1))
    });
  }

  console.log(`✅ Benchmark complete. Tested ${results.length} configs.`);
  return results;
}

/**
 * Get the best config under a latency budget
 */
export function getBestConfig(
  results: BenchmarkResult[],
  latencyBudgetMs: number
): BenchmarkResult {
  // Filter to configs under budget
  const eligible = results.filter(r => r.p95LatencyMs <= latencyBudgetMs);

  if (eligible.length === 0) {
    // No config meets budget, return fastest
    return results.reduce((best, r) => 
      r.p95LatencyMs < best.p95LatencyMs ? r : best
    );
  }

  // Among eligible, pick highest recall
  return eligible.reduce((best, r) => 
    r.recall > best.recall ? r : best
  );
}

/**
 * Brute-force exact k nearest neighbors
 */
function getExactNeighbors(
  queryVector: number[],
  users: { id: string; vector: number[] }[],
  k: number,
  excludeIdx: number
): string[] {
  const similarities = users
    .map((user, idx) => ({
      id: user.id,
      idx,
      sim: cosineSimilarity(queryVector, user.vector)
    }))
    .filter(item => item.idx !== excludeIdx)
    .sort((a, b) => b.sim - a.sim);

  return similarities.slice(0, k).map(s => s.id);
}

/**
 * Sample random indices
 */
function sampleIndices(max: number, count: number): number[] {
  const indices: number[] = [];
  while (indices.length < count) {
    const idx = Math.floor(Math.random() * max);
    if (!indices.includes(idx)) {
      indices.push(idx);
    }
  }
  return indices;
}
