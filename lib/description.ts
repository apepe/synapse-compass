// Generate ChatGPT-style descriptions for entities

interface EntityInfo {
  name: string
  type: string
  parentName: string | null
}

const getFileTypeDescription = (fileName: string, type: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  const typeName = type.split('.').pop() || ''
  
  if (typeName.includes('Folder')) {
    return 'a folder'
  }
  
  if (typeName.includes('Project')) {
    return 'a project'
  }
  
  if (typeName.includes('Table')) {
    return 'a table'
  }
  
  if (typeName.includes('Link')) {
    return 'a link'
  }
  
  // File type descriptions
  switch (extension) {
    case 'r':
    case 'rscript':
      return 'an R file (R is a statistical programming language)'
    case 'py':
      return 'a Python file (Python is a high-level programming language)'
    case 'js':
    case 'jsx':
      return 'a JavaScript file'
    case 'ts':
    case 'tsx':
      return 'a TypeScript file'
    case 'md':
      return 'a Markdown file'
    case 'json':
      return 'a JSON file (JavaScript Object Notation)'
    case 'csv':
      return 'a CSV file (Comma-Separated Values)'
    case 'txt':
      return 'a text file'
    case 'pdf':
      return 'a PDF file (Portable Document Format)'
    case 'xlsx':
    case 'xls':
      return 'an Excel file'
    case 'zip':
      return 'a ZIP archive'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'an image file'
    default:
      return 'a file'
  }
}

export function generateEntityDescription(entity: EntityInfo): string {
  const fileTypeDesc = getFileTypeDescription(entity.name, entity.type)
  const projectName = entity.parentName || 'a Synapse project'
  
  return `${entity.name} is ${fileTypeDesc} which is part of a Synapse project called "${projectName}".`
}

