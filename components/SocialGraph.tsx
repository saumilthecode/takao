/**
 * ============================================================
 * 📄 FILE: frontend/components/SocialGraph.tsx
 * 
 * 🎯 PURPOSE:
 *    3D force graph visualization of the social network.
 *    Features: hover tooltips, click interactions, match explanations.
 * 
 * 🛠️ TECH USED:
 *    - react-force-graph-3d
 *    - Three.js (via react-force-graph-3d)
 *    - shadcn/ui components
 * 
 * ============================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchGraph, fetchMatchExplanation, GraphNode, GraphLink, GraphData, MatchExplanation } from '@/lib/api';
import { Users, X } from 'lucide-react';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function SocialGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [graphMode, setGraphMode] = useState<'force' | 'embedding'>('force');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [topMatches, setTopMatches] = useState<Array<{ node: GraphNode; similarity: number }>>([]);
  const [matchExplanation, setMatchExplanation] = useState<MatchExplanation | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [linkThreshold, setLinkThreshold] = useState(0.2);
  const [highlightPod, setHighlightPod] = useState(false);
  const graphRef = useRef<any>();

  // Fetch graph data on mount
  useEffect(() => {
    loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphMode]);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const data = await fetchGraph(graphMode);
      
      // Filter out links that reference non-existent nodes
      const nodeIds = new Set(data.nodes.map(n => n.id));
      const validLinks = data.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      });
      
      setGraphData({
        ...data,
        links: validLinks
      });
    } catch (error) {
      console.error('Failed to load graph:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle node hover - show tooltip
  const handleNodeHover = useCallback((node: GraphNode | null, event?: MouseEvent) => {
    if (node && event) {
      setHoveredNode(node);
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        node
      });
    } else {
      setHoveredNode(null);
      setTooltip(null);
    }
  }, []);

  // Handle node click - highlight neighbors and show top matches
  const handleNodeClick = useCallback(async (node: GraphNode) => {
    if (!graphData) return;

    setSelectedNode(node);
    setHighlightPod(true);

    // Find top 5 matches (nodes connected to this one, sorted by link strength)
    const connectedLinks = graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return sourceId === node.id || targetId === node.id;
    });

    const matches = connectedLinks
      .map(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        const otherId = sourceId === node.id ? targetId : sourceId;
        const otherNode = graphData.nodes.find(n => n.id === otherId);
        return otherNode ? { node: otherNode, similarity: link.strength } : null;
      })
      .filter((match): match is { node: GraphNode; similarity: number } => match !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    setTopMatches(matches);

    // Fetch detailed match explanation for the top match
    if (matches.length > 0) {
      try {
        const explanation = await fetchMatchExplanation(node.id, matches[0].node.id);
        setMatchExplanation(explanation);
      } catch (error) {
        console.error('Failed to fetch match explanation:', error);
      }
    }
  }, [graphData]);

  // Handle match click - show explanation
  const handleMatchClick = async (matchNode: GraphNode) => {
    if (!selectedNode) return;

    try {
      const explanation = await fetchMatchExplanation(selectedNode.id, matchNode.id);
      setMatchExplanation(explanation);
    } catch (error) {
      console.error('Failed to fetch match explanation:', error);
    }
  };

  // Update link opacity based on selection
  const getLinkOpacity = useCallback((link: GraphLink) => {
    if (!selectedNode) return 0.3;
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return (sourceId === selectedNode.id || targetId === selectedNode.id) ? 1 : 0.1;
  }, [selectedNode]);

  // Update link width based on selection
  const getLinkWidth = useCallback((link: GraphLink) => {
    if (!selectedNode) return 1;
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return (sourceId === selectedNode.id || targetId === selectedNode.id) ? 3 : 0.5;
  }, [selectedNode]);

  const podNodeIds = useMemo(() => {
    if (!selectedNode || topMatches.length === 0) return new Set<string>();
    return new Set([selectedNode.id, ...topMatches.map(match => match.node.id)]);
  }, [selectedNode, topMatches]);

  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;
    const linkBuckets = new Map<string, GraphLink[]>();
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      if (!linkBuckets.has(sourceId)) linkBuckets.set(sourceId, []);
      if (!linkBuckets.has(targetId)) linkBuckets.set(targetId, []);
      linkBuckets.get(sourceId)?.push(link);
      linkBuckets.get(targetId)?.push(link);
    });

    const filteredLinks: GraphLink[] = [];
    linkBuckets.forEach(links => {
      const selected = links
        .filter(link => link.strength >= linkThreshold)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 4);
      selected.forEach(link => {
        if (!filteredLinks.includes(link)) {
          filteredLinks.push(link);
        }
      });
    });

    return {
      ...graphData,
      links: filteredLinks
    };
  }, [graphData, linkThreshold]);

  useEffect(() => {
    if (!filteredGraphData || !graphRef.current) return;
    const timeout = window.setTimeout(() => {
      graphRef.current?.zoomToFit(800, 40);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [filteredGraphData]);


  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading graph...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!graphData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[600px]">
          <p className="text-muted-foreground">Failed to load graph data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 3D Graph */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              3D Social Graph
              <Badge variant="outline" className="text-xs">Dev/UAT</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Force</span> keeps related people closer by simulation.{' '}
              <span className="font-medium text-foreground">Embedding</span> places everyone by learned similarity coordinates.
            </div>
            <div className="relative h-[720px] overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-background via-background to-black/90 shadow-[0_0_0_1px_rgba(195,206,148,0.12),0_20px_60px_rgba(0,0,0,0.6)] lg:aspect-square lg:h-auto lg:max-h-[720px]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_20%,rgba(195,206,148,0.12),transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.85)_100%)]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(195,206,148,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(195,206,148,0.2)_1px,transparent_1px)] bg-[size:44px_44px]" />

              <div className="absolute left-4 top-4 z-10 rounded-xl border border-border bg-background/70 px-3 py-2 text-xs text-foreground">
                <div className="font-semibold">Legend</div>
                <div className="mt-2 flex flex-col gap-1">
                  <span>Clusters</span>
                  <span>You</span>
                  <span>Pod</span>
                </div>
              </div>

              <div className="absolute right-4 top-4 z-10 flex flex-col gap-3 rounded-xl border border-border bg-background/70 p-3 text-xs text-foreground">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={graphMode === 'force' ? 'default' : 'outline'}
                    onClick={() => setGraphMode('force')}
                  >
                    Force
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={graphMode === 'embedding' ? 'default' : 'outline'}
                    onClick={() => setGraphMode('embedding')}
                  >
                    Embedding
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Link threshold</span>
                    <span>{linkThreshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={linkThreshold}
                    onChange={(e) => setLinkThreshold(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={highlightPod ? 'default' : 'outline'}
                    onClick={() => setHighlightPod(prev => !prev)}
                    disabled={!selectedNode}
                  >
                    Highlight pod
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => graphRef.current?.zoomToFit(600, 40)}
                  >
                    Reset camera
                  </Button>
                </div>
              </div>

              {typeof window !== 'undefined' && filteredGraphData && (
                <ForceGraph3D
                  ref={graphRef}
                  graphData={filteredGraphData}
                  nodeLabel={(node: any) => `${node.name}\n${node.age} years old\n${node.uni}`}
                  nodeColor={(node: any) => {
                    const isSelected = selectedNode && node.id === selectedNode.id;
                    const isHovered = hoveredNode && node.id === hoveredNode.id;
                    const isPod = highlightPod && podNodeIds.has(node.id);
                    if (isSelected) return '#c3ce94';
                    if (isHovered) return '#dbe4b7';
                    if (isPod) return '#b7c789';
                    const colors = ['#c3ce94', '#aab874', '#92a45f', '#7a904b', '#6a7d3f', '#576636'];
                    return colors[node.clusterId % colors.length] || '#6b7280';
                  }}
                  nodeVal={(node: any) => {
                    const base = 3 + (node.traits?.extraversion || 0) * 2;
                    if (selectedNode && node.id === selectedNode.id) return base + 3;
                    if (highlightPod && podNodeIds.has(node.id)) return base + 1.5;
                    return base;
                  }}
                  linkSource="source"
                  linkTarget="target"
                  linkOpacity={getLinkOpacity}
                  linkWidth={getLinkWidth}
                  linkColor={(link: any) => {
                    const strength = link?.strength ?? 0.2;
                    return `rgba(195,206,148,${Math.min(0.5, Math.max(0.12, strength))})`;
                  }}
                  onNodeHover={handleNodeHover}
                  onNodeClick={(node: any) => {
                    handleNodeClick(node);
                    graphRef.current?.cameraPosition(
                      { x: node.x * 1.2, y: node.y * 1.2, z: node.z * 1.2 + 80 },
                      node,
                      900
                    );
                  }}
                  enableNodeDrag={true}
                  showNavInfo={false}
                />
              )}

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute z-50 bg-background border border-border rounded-lg shadow-lg p-3 pointer-events-none"
                  style={{
                    left: `${tooltip.x + 10}px`,
                    top: `${tooltip.y + 10}px`,
                    maxWidth: '200px'
                  }}
                >
                  <div className="font-semibold text-sm">{tooltip.node.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Age: {tooltip.node.age}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tooltip.node.uni}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: Top Matches & Explanation */}
      <div className="lg:col-span-1 space-y-6">
        {/* Top Matches */}
        {selectedNode && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Pod of 5</CardTitle>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setTopMatches([]);
                  setMatchExplanation(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {topMatches.map((match, idx) => (
                    <div
                      key={match.node.id}
                      onClick={() => handleMatchClick(match.node)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        matchExplanation?.user2.id === match.node.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{match.node.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {match.node.age} • {match.node.uni}
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {(match.similarity * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {selectedNode && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pod cohesion score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-primary">
                {topMatches.length
                  ? `${(topMatches.reduce((sum, match) => sum + match.similarity, 0) / topMatches.length * 100).toFixed(0)}%`
                  : '—'}
              </div>
              <div className="text-xs text-muted-foreground">Why this pod fits</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {matchExplanation?.topContributors.slice(0, 3).map((contrib, idx) => (
                  <li key={idx} className="capitalize">
                    {contrib.dimension} alignment
                  </li>
                ))}
                {!matchExplanation && (
                  <li>Shared interests and compatible group dynamics.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Match Explanation Panel */}
        {matchExplanation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Match Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Similarity Score */}
                <div>
                  <div className="text-sm font-medium mb-2">Similarity Score</div>
                  <div className="text-2xl font-bold text-primary">
                    {(matchExplanation.similarity * 100).toFixed(1)}%
                  </div>
                  <div className="h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${matchExplanation.similarity * 100}%` }}
                    />
                  </div>
                </div>

                {/* Top Contributing Dimensions */}
                <div>
                  <div className="text-sm font-medium mb-2">Top Contributing Dimensions</div>
                  <div className="space-y-2">
                    {matchExplanation.topContributors.map((contrib, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-muted-foreground">
                          {contrib.dimension}
                        </span>
                        <span className="font-medium">
                          {(contrib.contribution * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Interests */}
                {matchExplanation.sharedInterests.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Shared Interests</div>
                    <div className="flex flex-wrap gap-1">
                      {matchExplanation.sharedInterests.map((interest, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions when nothing selected */}
        {!selectedNode && (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click a node to see</p>
              <p>top matches and explanations</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================
 * 📄 FILE FOOTER: frontend/components/SocialGraph.tsx
 * ============================================================
 * PURPOSE:
 *    3D social graph view with pod-of-5 insights and view toggle.
 * TECH USED:
 *    - react-force-graph-3d
 *    - React
 *    - shadcn/ui
 * ============================================================
 */
