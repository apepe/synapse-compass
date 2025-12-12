'use client'

interface EntityAnnotationsWidgetProps {
  annotations: Record<string, any> | null
}

export default function EntityAnnotationsWidget({ annotations }: EntityAnnotationsWidgetProps) {
  if (!annotations) {
    return null
  }

  // Extract annotations from different formats
  const getAnnotationEntries = () => {
    const entries: Array<{ key: string; value: string }> = []

    // Check annotations2 format: { annotations: { "key": { value: [...] } } }
    if (annotations.annotations && typeof annotations.annotations === 'object') {
      const annotationKeys = Object.keys(annotations.annotations)
      for (const key of annotationKeys) {
        const ann = annotations.annotations[key]
        if (ann && ann.value) {
          const values = Array.isArray(ann.value) ? ann.value : [ann.value]
          values.forEach((val: any) => {
            entries.push({ key, value: String(val) })
          })
        }
      }
    }

    // Check annotations format: { stringAnnotations: { "key": [...] } }
    if (annotations.stringAnnotations && typeof annotations.stringAnnotations === 'object' && !Array.isArray(annotations.stringAnnotations)) {
      const stringAnnKeys = Object.keys(annotations.stringAnnotations)
      for (const key of stringAnnKeys) {
        const values = annotations.stringAnnotations[key]
        if (Array.isArray(values)) {
          values.forEach((val: any) => {
            entries.push({ key, value: String(val) })
          })
        } else if (values !== null && values !== undefined) {
          entries.push({ key, value: String(values) })
        }
      }
    }

    // Check longAnnotations, doubleAnnotations, dateAnnotations, etc.
    const annotationTypes = ['longAnnotations', 'doubleAnnotations', 'dateAnnotations', 'blobAnnotations']
    for (const type of annotationTypes) {
      if (annotations[type] && typeof annotations[type] === 'object' && !Array.isArray(annotations[type])) {
        const typeKeys = Object.keys(annotations[type])
        for (const key of typeKeys) {
          const values = annotations[type][key]
          if (Array.isArray(values)) {
            values.forEach((val: any) => {
              entries.push({ key, value: String(val) })
            })
          } else if (values !== null && values !== undefined) {
            entries.push({ key, value: String(values) })
          }
        }
      }
    }

    return entries
  }

  const annotationEntries = getAnnotationEntries()

  if (annotationEntries.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Entity Annotations</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Key</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">Value</th>
            </tr>
          </thead>
          <tbody>
            {annotationEntries.map((entry, index) => (
              <tr
                key={`${entry.key}-${index}`}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="py-2 px-3 text-gray-700 font-medium">{entry.key}</td>
                <td className="py-2 px-3 text-gray-600 break-words">{entry.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

