/**
 * ============================================================
 * 📄 FILE: frontend/components/TunerDashboard.tsx
 * 
 * 🎯 PURPOSE:
 *    Placeholder for index tuner dashboard (future feature).
 * 
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchTunerBenchmark, BenchmarkResult } from '@/lib/api';
import { Settings } from 'lucide-react';

export default function TunerDashboard() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTrials = async () => {
    setIsRunning(true);
    try {
      const response = await fetchTunerBenchmark(50);
      setResults(response.configs);
    } catch (error) {
      console.error('Failed to run tuner benchmark:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Index Tuner Dashboard
          </CardTitle>
          <Button
            size="sm"
            onClick={handleRunTrials}
            disabled={isRunning}
            className="bg-black text-white hover:bg-black/90"
          >
            {isRunning ? 'Running...' : 'Run 10 trials'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="latency" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="latency">Latency</TabsTrigger>
            <TabsTrigger value="recall">Recall</TabsTrigger>
          </TabsList>

          <TabsContent value="latency" className="mt-6">
            <p className="text-xs text-muted-foreground mb-4">
              <span className="font-medium text-foreground">Latency</span> is how fast results return. Lower is better for live matching.
            </p>
            {results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No trials yet.</p>
                <p className="text-sm mt-2">Run 10 trials to benchmark latency configs.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="py-2 text-left">M</th>
                      <th className="py-2 text-left">efSearch</th>
                      <th className="py-2 text-left">Avg latency</th>
                      <th className="py-2 text-left">P95 latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => (
                      <tr key={`${result.M}-${result.efSearch}-${idx}`} className="border-t border-border">
                        <td className="py-2">{result.M}</td>
                        <td className="py-2">{result.efSearch}</td>
                        <td className="py-2">{result.avgLatencyMs.toFixed(1)}ms</td>
                        <td className="py-2">{result.p95LatencyMs.toFixed(1)}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recall" className="mt-6">
            <p className="text-xs text-muted-foreground mb-4">
              <span className="font-medium text-foreground">Recall</span> is how often we retrieve the true best matches. Higher is better.
            </p>
            {results.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No trials yet.</p>
                <p className="text-sm mt-2">Run 10 trials to benchmark recall.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="py-2 text-left">M</th>
                      <th className="py-2 text-left">efSearch</th>
                      <th className="py-2 text-left">Recall</th>
                      <th className="py-2 text-left">QPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => (
                      <tr key={`${result.M}-${result.efSearch}-${idx}`} className="border-t border-border">
                        <td className="py-2">{result.M}</td>
                        <td className="py-2">{result.efSearch}</td>
                        <td className="py-2">{(result.recall * 100).toFixed(1)}%</td>
                        <td className="py-2">{result.queriesPerSecond.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * ============================================================
 * 📄 FILE FOOTER: frontend/components/TunerDashboard.tsx
 * ============================================================
 * PURPOSE:
 *    Lightweight tuner UI for latency/recall benchmarking.
 * TECH USED:
 *    - React
 *    - shadcn/ui Tabs + Button
 * ============================================================
 */
