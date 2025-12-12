'use client'

import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useRouter } from 'next/navigation'

interface EntityNode {
  id: string
  name: string
  type: string
  isCurrent?: boolean
  isParent?: boolean
  x?: number
  y?: number
}

interface EntityGraphProps {
  currentEntityId: string
  currentEntityName: string
  parentId: string | null
  parentName: string | null
  siblings: Array<{ id: string; name: string; type: string }>
}

export default function EntityGraph({
  currentEntityId,
  currentEntityName,
  parentId,
  parentName,
  siblings,
}: EntityGraphProps) {
  const router = useRouter()
  const fgRef = useRef<any>()
  const [hoverNode, setHoverNode] = useState<EntityNode | null>(null)

  // Build graph data
  const graphData = useMemo(() => {
    const nodes: EntityNode[] = []
    const links: Array<{ source: string; target: string }> = []

    // Add parent node if exists
    if (parentId) {
      nodes.push({
        id: parentId,
        name: parentName || 'Parent Folder',
        type: 'Folder',
        isParent: true,
      })
    }

    // Add current entity node
    nodes.push({
      id: currentEntityId,
      name: currentEntityName,
      type: 'Current',
      isCurrent: true,
    })

    // Add sibling nodes
    siblings.forEach((sibling) => {
      // Don't add the current entity again
      if (sibling.id !== currentEntityId) {
        nodes.push({
          id: sibling.id,
          name: sibling.name,
          type: sibling.type,
        })
      }
    })

    // Create links: all nodes connect to parent (if exists)
    if (parentId) {
      nodes.forEach((node) => {
        if (node.id !== parentId) {
          links.push({
            source: parentId,
            target: node.id,
          })
        }
      })
    }

    return { nodes, links }
  }, [currentEntityId, currentEntityName, parentId, parentName, siblings])

  // Handle node click - navigate to clicked entity
  const handleNodeClick = useCallback(
    (node: EntityNode) => {
      if (node.id !== currentEntityId) {
        router.push(`/?synId=${node.id}`)
      }
    },
    [currentEntityId, router]
  )

  // Color nodes based on type
  const nodeColor = useCallback((node: EntityNode) => {
    if (node.isCurrent) {
      return '#3b82f6' // Blue for current entity
    }
    if (node.isParent) {
      return '#8b5cf6' // Purple for parent folder
    }
    return '#64748b' // Gray for siblings
  }, [])

  // Size nodes based on type
  const nodeSize = useCallback((node: EntityNode) => {
    if (node.isCurrent) {
      return 18
    }
    if (node.isParent) {
      return 14
    }
    return 8
  }, [])

  // Zoom to fit after graph loads
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Wait for graph to stabilize, then zoom to fit with padding
      const timer = setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400, 80)
        }
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [graphData])

  if (!parentId && siblings.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#1a1a2e] rounded-lg border border-gray-800">
        <p className="text-gray-400">No parent folder or siblings found</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[700px] bg-[#1a1a2e] rounded-lg border border-gray-800 overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node: EntityNode) => `${node.name}\n(${node.id})`}
        nodeColor={nodeColor}
        nodeVal={nodeSize}
        linkColor={() => '#374151'}
        linkWidth={2}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => {
          setHoverNode(node as EntityNode | null)
          if (node) {
            document.body.style.cursor = node.id !== currentEntityId ? 'pointer' : 'default'
          } else {
            document.body.style.cursor = 'default'
          }
        }}
        nodeCanvasObject={(node: EntityNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          // Only show label for current node or hovered node
          const showLabel = node.isCurrent || (hoverNode && hoverNode.id === node.id)
          
          if (!showLabel) return
          
          const label = node.name.length > 30 ? node.name.substring(0, 30) + '...' : node.name
          const fontSize = node.isCurrent ? Math.max(16 / Math.sqrt(globalScale), 12) : Math.max(12 / Math.sqrt(globalScale), 10)
          const padding = node.isCurrent ? 10 : 6
          const textWidth = ctx.measureText(label).width
          const bckgDimensions = [textWidth + padding * 2, fontSize + padding * 2]
          
          // Draw label background
          ctx.fillStyle = node.isCurrent 
            ? 'rgba(59, 130, 246, 0.2)' 
            : 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(
            (node.x || 0) - bckgDimensions[0] / 2,
            (node.y || 0) + (nodeSize(node) || 0) + 8,
            bckgDimensions[0],
            bckgDimensions[1]
          )
          
          // Draw label border
          ctx.strokeStyle = node.isCurrent 
            ? '#3b82f6' 
            : '#6b7280'
          ctx.lineWidth = node.isCurrent ? 2 : 1
          ctx.strokeRect(
            (node.x || 0) - bckgDimensions[0] / 2,
            (node.y || 0) + (nodeSize(node) || 0) + 8,
            bckgDimensions[0],
            bckgDimensions[1]
          )
          
          // Draw label text
          ctx.font = `${node.isCurrent ? '700' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = node.isCurrent 
            ? '#93c5fd' 
            : '#d1d5db'
          ctx.fillText(
            label,
            node.x || 0,
            (node.y || 0) + (nodeSize(node) || 0) + 8 + bckgDimensions[1] / 2
          )
        }}
        cooldownTicks={150}
        onEngineStop={() => {
          // Graph has stabilized
        }}
      />
      <div className="p-4 bg-[#0f0f23] border-t border-gray-800">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Current Entity</span>
          </div>
          {parentId && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Parent Folder</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Siblings ({siblings.length})</span>
          </div>
          <div className="ml-auto text-gray-500">
            Click to navigate • Hover to see labels • Drag to move
          </div>
        </div>
      </div>
    </div>
  )
}

