'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Entity {
  id: string
  name: string
  type: string
  isCurrent?: boolean
  isParent?: boolean
}

type EntityWithFlags = Entity & {
  isCurrent?: boolean
  isParent?: boolean
}

interface FolderTreeProps {
  currentEntityId: string
  currentEntityName: string
  parentId: string | null
  parentName: string | null
  siblings: Array<{ id: string; name: string; type: string }>
}

const getFileIcon = (fileName: string, type: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const typeName = type.split('.').pop() || ''
  
  if (typeName.includes('Folder')) {
    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
  }
  
  if (typeName.includes('Table')) {
    return (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  }
  
  switch (extension) {
    case 'r':
    case 'rscript':
      return <span className="text-blue-600 font-mono text-xs">R</span>
    case 'py':
      return <span className="text-yellow-600 font-mono text-xs">Py</span>
    case 'js':
    case 'jsx':
      return <span className="text-yellow-700 font-mono text-xs">JS</span>
    case 'ts':
    case 'tsx':
      return <span className="text-blue-600 font-mono text-xs">TS</span>
    case 'md':
      return <span className="text-gray-600 font-mono text-xs">MD</span>
    case 'json':
      return <span className="text-green-600 font-mono text-xs">JSON</span>
    case 'csv':
      return <span className="text-green-700 font-mono text-xs">CSV</span>
    default:
      return (
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

export default function FolderTree({
  currentEntityId,
  currentEntityName,
  parentId,
  parentName,
  siblings,
}: FolderTreeProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)

  const handleClick = (id: string) => {
    if (id !== currentEntityId) {
      router.push(`/?synId=${id}`)
    }
  }

  // Filter out the parent from siblings (don't show it twice)
  const filteredSiblings = siblings.filter(s => s.id !== parentId)
  
  const allItems: EntityWithFlags[] = [
    ...(parentId && parentName ? [{
      id: parentId,
      name: parentName,
      type: 'org.sagebionetworks.repo.model.Folder',
      isParent: true,
    } as EntityWithFlags] : []),
    ...filteredSiblings.map(s => ({
      ...s,
      isCurrent: s.id === currentEntityId,
    } as EntityWithFlags)),
  ]

  // Group items by type for better organization
  const folders = allItems.filter(item => item.type.includes('Folder') || item.type.includes('Project'))
  const files = allItems.filter(item => !item.type.includes('Folder') && !item.type.includes('Project'))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Project Structure
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className="space-y-1">
        {expanded && parentId && parentName && (
          <div 
            onClick={() => handleClick(parentId)}
            className="mb-3 pb-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-medium flex-1">{parentName}</span>
              <span className="text-xs text-blue-600 font-medium">Parent</span>
            </div>
          </div>
        )}

        {expanded && folders.length > 0 && (
          <div className="mb-4">
            {folders.map((item) => (
              <div
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  item.isParent
                    ? 'bg-blue-50 border border-blue-200'
                    : item.isCurrent
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                {getFileIcon(item.name, item.type)}
                <span className={`text-sm flex-1 ${
                  item.isParent 
                    ? 'text-blue-700 font-medium' 
                    : item.isCurrent
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-700'
                }`}>
                  {item.name}
                </span>
                {item.isParent && (
                  <span className="text-xs text-blue-600">Parent</span>
                )}
                {item.isCurrent && !item.isParent && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {expanded && files.length > 0 && (
          <div className="space-y-1">
            {files.map((item) => (
              <div
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  item.isCurrent
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                {getFileIcon(item.name, item.type)}
                <span className={`text-sm flex-1 ${
                  item.isCurrent ? 'text-blue-700 font-semibold' : 'text-gray-600'
                }`}>
                  {item.name}
                </span>
                {item.isCurrent && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!expanded && (
          <div className="text-center py-8 text-gray-500 text-sm">
            Click "Expand" to view project structure
          </div>
        )}
      </div>

      {expanded && allItems.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No siblings or parent folder found
        </div>
      )}
    </div>
  )
}

