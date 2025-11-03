/**
 * Advanced layout engine using dagre for optimal graph positioning
 */
import dagre from 'dagre';

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: any;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSpacing?: number;
  rankSpacing?: number;
  align?: 'UL' | 'UR' | 'DL' | 'DR';
}

/**
 * Apply dagre auto-layout to nodes
 * Creates symmetrical, non-overlapping layout with optimal edge routing
 */
export function applyDagreLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options: LayoutOptions = {}
): LayoutNode[] {
  const {
    direction = 'TB',
    nodeSpacing = 50,
    rankSpacing = 150,
    align = 'UL',
  } = options;

  // Create a new directed graph
  const dagreGraph = new dagre.graphlib.Graph();
  
  // Set graph defaults
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    align: align,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to graph with dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 220,  // Node width
      height: 120, // Node height (adjusted for variants)
    });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run dagre layout algorithm
  dagre.layout(dagreGraph);

  // Apply calculated positions back to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        // Center the node on the calculated position
        x: nodeWithPosition.x - 110, // Half of node width
        y: nodeWithPosition.y - 60,  // Half of node height
      },
    };
  });

  return layoutedNodes;
}

/**
 * Apply linear layout (simple vertical stacking with branch indentation)
 */
export function applyLinearLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): LayoutNode[] {
  // Build adjacency map
  const outgoingCount = new Map<string, number>();
  const incomingEdges = new Map<string, LayoutEdge[]>();
  
  edges.forEach(edge => {
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge);
  });

  // Topological sort
  const pageOrder = topologicalSort(nodes, edges);
  const layoutedNodes: LayoutNode[] = [];
  let yOffset = 80;
  const processed = new Set<string>();
  const centerX = 500;

  pageOrder.forEach((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || processed.has(nodeId)) return;

    const hasBranches = (outgoingCount.get(nodeId) || 0) > 1;

    // Add branch condition info
    const incoming = incomingEdges.get(nodeId) || [];
    if (incoming.length > 0 && incoming[0].data?.condition) {
      node.data.branchInfo = {
        condition: incoming[0].data.condition,
        isActive: incoming[0].data.conditionMet || false,
      };
    } else {
      node.data.branchInfo = undefined;
    }

    if (hasBranches && !processed.has(nodeId)) {
      // Main branching page - center
      layoutedNodes.push({
        ...node,
        position: { x: centerX, y: yOffset },
      });
      processed.add(nodeId);
      yOffset += 240;

      // Position branch alternatives side-by-side
      const branchEdges = edges.filter(e => e.source === nodeId);
      const branchCount = branchEdges.length;
      const totalWidth = branchCount * 350;
      const startX = centerX - (totalWidth / 2) + 175;

      branchEdges.forEach((edge, idx) => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode && !processed.has(edge.target)) {
          targetNode.data.branchInfo = {
            condition: edge.data?.condition || `Branch ${idx + 1}`,
            isActive: edge.data?.conditionMet || false,
          };

          layoutedNodes.push({
            ...targetNode,
            position: { x: startX + (idx * 350), y: yOffset },
          });
          processed.add(edge.target);
        }
      });

      yOffset += 240;
    } else if (!processed.has(nodeId)) {
      // Regular page - center
      layoutedNodes.push({
        ...node,
        position: { x: centerX, y: yOffset },
      });
      processed.add(nodeId);
      yOffset += 200;
    }
  });

  // Add any remaining unprocessed nodes
  nodes.forEach(node => {
    if (!processed.has(node.id)) {
      layoutedNodes.push({
        ...node,
        position: { x: centerX, y: yOffset },
      });
      yOffset += 200;
    }
  });

  return layoutedNodes;
}

/**
 * Topological sort for determining page order
 */
function topologicalSort(nodes: LayoutNode[], edges: LayoutEdge[]): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    if (visiting.has(nodeId)) return; // Cycle detection

    visiting.add(nodeId);

    // Visit dependencies first
    const outgoing = edges.filter(e => e.source === nodeId);
    outgoing.forEach(edge => visit(edge.target));

    visiting.delete(nodeId);
    visited.add(nodeId);
    sorted.unshift(nodeId);
  };

  // Start from P1 or first node
  const startNode = nodes.find(n => n.id === 'P1') || nodes[0];
  if (startNode) {
    visit(startNode.id);
  }

  // Visit any remaining
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  });

  return sorted;
}

