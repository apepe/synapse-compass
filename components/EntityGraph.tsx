'use client'

import { useCallback, useMemo } from 'react'
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
  }, [currentEntityId, currentEntityName, parentId, siblings])

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
    return '#6b7280' // Gray for siblings
  }, [])

  // Size nodes based on type
  const nodeSize = useCallback((node: EntityNode) => {
    if (node.isCurrent) {
      return 12
    }
    if (node.isParent) {
      return 10
    }
    return 8
  }, [])

  if (!parentId && siblings.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No parent folder or siblings found</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] bg-white rounded-lg border border-gray-200 overflow-hidden">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel={(node: EntityNode) => `${node.name}\n(${node.id})`}
        nodeColor={nodeColor}
        nodeVal={nodeSize}
        linkColor={() => '#e5e7eb'}
        linkWidth={2}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node: EntityNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px Sans-Serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = node.isCurrent ? '#1e40af' : node.isParent ? '#6b21a8' : '#374151'
          ctx.fillText(label, node.x || 0, (node.y || 0) + 15)
        }}
        cooldownTicks={100}
        onEngineStop={() => {
          // Graph has stabilized
        }}
      />
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm">
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
          <div className="ml-auto text-xs text-gray-500">
            Click nodes to navigate • Drag to move
          </div>
        </div>
      </div>
    </div>
  )
}

