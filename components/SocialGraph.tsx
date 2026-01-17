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

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { fetchGraph, fetchMatchExplanation, GraphNode, GraphLink, GraphData, MatchExplanation } from '@/lib/api';
import { Users, X } from 'lucide-react';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function SocialGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [topMatches, setTopMatches] = useState<Array<{ node: GraphNode; similarity: number }>>([]);
  const [matchExplanation, setMatchExplanation] = useState<MatchExplanation | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const graphRef = useRef<any>();

  // Fetch graph data on mount
  useEffect(() => {
    loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const data = await fetchGraph('force');
      
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[600px] bg-black rounded-lg overflow-hidden">
              {typeof window !== 'undefined' && (
                <ForceGraph3D
                  ref={graphRef}
                  graphData={graphData}
                  nodeLabel={(node: any) => `${node.name}\n${node.age} years old\n${node.uni}`}
                  nodeColor={(node: any) => {
                    if (selectedNode && node.id === selectedNode.id) return '#3b82f6'; // blue for selected
                    if (hoveredNode && node.id === hoveredNode.id) return '#10b981'; // green for hovered
                    // Color by cluster
                    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
                    return colors[node.clusterId % colors.length] || '#6b7280';
                  }}
                  nodeVal={(node: any) => 3 + (node.traits?.extraversion || 0) * 2}
                  linkSource="source"
                  linkTarget="target"
                  linkOpacity={getLinkOpacity}
                  linkWidth={getLinkWidth}
                  linkColor={() => '#64748b'}
                  onNodeHover={handleNodeHover}
                  onNodeClick={handleNodeClick}
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
              <CardTitle className="text-lg">Top Matches</CardTitle>
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
