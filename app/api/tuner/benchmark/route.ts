/**
 * ============================================================
 * 📄 FILE: app/api/tuner/benchmark/route.ts
 * 
 * 🎯 PURPOSE:
 *    Next.js API route for index tuner benchmark.
 *    Returns HNSW parameter tuning results.
 * 
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/src/init';
import { runBenchmark, getBestConfig } from '@/src/services/tuner';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  await ensureInitialized();
  try {
    const searchParams = request.nextUrl.searchParams;
    const latencyBudget = parseFloat(searchParams.get('latencyBudget') || '50');

    // Run benchmark across multiple configs
    const results = await runBenchmark();

    // Select best config under latency budget
    const selectedConfig = getBestConfig(results, latencyBudget);

    return NextResponse.json({
      latencyBudgetMs: latencyBudget,
      totalConfigsTested: results.length,
      configs: results,
      selectedConfig,
      explanation: `Selected config with highest recall@10 (${(selectedConfig.recall * 100).toFixed(1)}%) under ${latencyBudget}ms latency budget`
    });
  } catch (error) {
    console.error('Tuner benchmark error:', error);
    return NextResponse.json(
      { error: 'Failed to run benchmark' },
      { status: 500 }
    );
  }
}
