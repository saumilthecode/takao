/**
 * ============================================================
 * 📄 FILE: backend/src/routes/tuner.ts
 * ============================================================
 * 
 * 🎯 PURPOSE:
 *    Exposes the HNSW index tuner benchmark results.
 *    Shows different (M, efConstruction, efSearch) configs vs recall/latency.
 *    This is the "self-optimizing" demo feature for judges.
 * 
 * 🛠️ TECH USED:
 *    - Fastify (route registration)
 *    - HNSW parameter sweep (from tuner service)
 *    - Benchmark metrics: recall@k, p95 latency
 * 
 * 📥 INPUT:
 *    GET /tuner/benchmark?latencyBudget=50
 * 
 * 📤 OUTPUT:
 *    { configs: BenchmarkResult[], selectedConfig: BenchmarkResult }
 * 
 * ============================================================
 */

import { FastifyInstance } from 'fastify';
import { runBenchmark, getBestConfig, TunerConfig } from '../services/tuner.js';

export async function tunerRoutes(fastify: FastifyInstance) {
  
  /**
   * GET /tuner/benchmark
   * Runs parameter sweep and returns all tested configs with metrics
   */
  fastify.get('/benchmark', async (request, reply) => {
    const { latencyBudget = 50 } = request.query as { latencyBudget?: number };

    try {
      // Run benchmark across multiple configs
      const results = await runBenchmark();

      // Select best config under latency budget
      const selectedConfig = getBestConfig(results, Number(latencyBudget));

      return {
        latencyBudgetMs: Number(latencyBudget),
        totalConfigsTested: results.length,
        configs: results,
        selectedConfig,
        explanation: `Selected config with highest recall@10 (${(selectedConfig.recall * 100).toFixed(1)}%) under ${latencyBudget}ms latency budget`
      };
    } catch (error) {
      console.error('Tuner error:', error);
      return reply.status(500).send({ error: 'Failed to run benchmark' });
    }
  });

  /**
   * GET /tuner/configs
   * Returns list of configs to test (for frontend display)
   */
  fastify.get('/configs', async () => {
    const configs: TunerConfig[] = [
      { M: 8, efConstruction: 100, efSearch: 50 },
      { M: 16, efConstruction: 100, efSearch: 50 },
      { M: 16, efConstruction: 200, efSearch: 100 },
      { M: 32, efConstruction: 200, efSearch: 100 },
      { M: 32, efConstruction: 400, efSearch: 200 },
      { M: 48, efConstruction: 400, efSearch: 200 },
    ];

    return {
      configs,
      description: 'HNSW parameters: M = max connections per node, efConstruction = build-time beam width, efSearch = query-time beam width'
    };
  });
}
