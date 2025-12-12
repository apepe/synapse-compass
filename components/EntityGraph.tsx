'use client'

import { useCallback, useMemo, useRef, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useRouter } from 'next/navigation'

interface EntityNode {
  id: string
  name: string
  type: string
  isCurrent?: boolean
  isParent?: boolean
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
      return '#2563eb' // Bright blue for current entity
    }
    if (node.isParent) {
      return '#7c3aed' // Purple for parent folder
    }
    return '#64748b' // Slate gray for siblings
  }, [])

  // Size nodes based on type
  const nodeSize = useCallback((node: EntityNode) => {
    if (node.isCurrent) {
      return 16
    }
    if (node.isParent) {
      return 14
    }
    return 10
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
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No parent folder or siblings found</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[700px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-slate-200 overflow-hidden shadow-inner">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node: EntityNode) => `${node.name}\n(${node.id})`}
        nodeColor={nodeColor}
        nodeVal={nodeSize}
        linkColor={() => '#cbd5e1'}
        linkWidth={2.5}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => {
          if (node) {
            document.body.style.cursor = node.id !== currentEntityId ? 'pointer' : 'default'
          } else {
            document.body.style.cursor = 'default'
          }
        }}
        nodeCanvasObject={(node: EntityNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name.length > 25 ? node.name.substring(0, 25) + '...' : node.name
          const fontSize = Math.max(14 / Math.sqrt(globalScale), 10)
          const padding = 8
          const textWidth = ctx.measureText(label).width
          const bckgDimensions = [textWidth + padding * 2, fontSize + padding * 2]
          
          // Draw label background
          ctx.fillStyle = node.isCurrent 
            ? 'rgba(37, 99, 235, 0.15)' 
            : node.isParent 
            ? 'rgba(124, 58, 237, 0.15)' 
            : 'rgba(255, 255, 255, 0.9)'
          ctx.fillRect(
            (node.x || 0) - bckgDimensions[0] / 2,
            (node.y || 0) + (nodeSize(node) || 0) + 5,
            bckgDimensions[0],
            bckgDimensions[1]
          )
          
          // Draw label border
          ctx.strokeStyle = node.isCurrent 
            ? '#2563eb' 
            : node.isParent 
            ? '#7c3aed' 
            : '#cbd5e1'
          ctx.lineWidth = 1.5
          ctx.strokeRect(
            (node.x || 0) - bckgDimensions[0] / 2,
            (node.y || 0) + (nodeSize(node) || 0) + 5,
            bckgDimensions[0],
            bckgDimensions[1]
          )
          
          // Draw label text
          ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = node.isCurrent 
            ? '#1e40af' 
            : node.isParent 
            ? '#6b21a8' 
            : '#334155'
          ctx.fillText(
            label,
            node.x || 0,
            (node.y || 0) + (nodeSize(node) || 0) + 5 + bckgDimensions[1] / 2
          )
        }}
        cooldownTicks={150}
        d3Force={(d3: any) => {
          d3.force('charge').strength(-300)
          d3.force('link').distance(120)
        }}
        onEngineStop={() => {
          // Graph has stabilized
        }}
      />
      <div className="p-5 bg-white/60 backdrop-blur-sm border-t-2 border-slate-200">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-blue-600 shadow-sm"></div>
            <span className="font-semibold text-slate-700">Current Entity</span>
          </div>
          {parentId && (
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-purple-600 shadow-sm"></div>
              <span className="font-semibold text-slate-700">Parent Folder</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-slate-500 shadow-sm"></div>
            <span className="font-semibold text-slate-700">Siblings ({siblings.length})</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span>Click nodes to navigate • Drag to move • Scroll to zoom</span>
          </div>
        </div>
      </div>
    </div>
  )
}

