import type {
  ParsedEndpoint,
  GeneratedSnippet,
  SnippetFormat,
} from '@/types/openapi'
import type { AuthInfo } from './auth-detector'

interface SnippetOptions {
  endpoint: ParsedEndpoint
  baseUrl: string
  auth: AuthInfo | null
}

export function generateSnippets(options: SnippetOptions): GeneratedSnippet[] {
  return [
    generateCurl(options),
    generateFetch(options),
    generatePython(options),
  ]
}

export function generateSnippet(
  format: SnippetFormat,
  options: SnippetOptions
): GeneratedSnippet {
  switch (format) {
    case 'curl':
      return generateCurl(options)
    case 'fetch':
      return generateFetch(options)
    case 'python':
      return generatePython(options)
  }
}

function generateCurl(options: SnippetOptions): GeneratedSnippet {
  const { endpoint, baseUrl, auth } = options
  const url = buildUrl(baseUrl, endpoint)
  const lines: string[] = []

  lines.push(`curl -X ${endpoint.method} "${url}"`)

  // Add auth header
  if (auth?.headerName && auth.headerValue) {
    lines.push(`  -H "${auth.headerName}: ${auth.headerValue}"`)
  }

  // Add Content-Type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    lines.push(`  -H "Content-Type: application/json"`)

    // Add example body if available
    const exampleBody = getExampleBody(endpoint)
    if (exampleBody) {
      lines.push(`  -d '${JSON.stringify(exampleBody, null, 2)}'`)
    }
  }

  return {
    format: 'curl',
    code: lines.join(' \\\n'),
    language: 'bash',
  }
}

function generateFetch(options: SnippetOptions): GeneratedSnippet {
  const { endpoint, baseUrl, auth } = options
  const url = buildUrl(baseUrl, endpoint)

  const headers: Record<string, string> = {}
  if (auth?.headerName && auth.headerValue) {
    // Use template literal for env var interpolation
    headers[auth.headerName] = auth.headerValue.replace(/\$/g, '${process.env.')
      .replace(/([A-Z_]+)(?=})/, '$1') + (auth.headerValue.includes('$') ? '' : '')
  }

  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    headers['Content-Type'] = 'application/json'
  }

  const fetchOptions: string[] = []

  if (endpoint.method !== 'GET') {
    fetchOptions.push(`  method: '${endpoint.method}'`)
  }

  if (Object.keys(headers).length > 0) {
    const headerLines = Object.entries(headers)
      .map(([key, value]) => {
        // Handle env var interpolation
        if (value.includes('$')) {
          const cleanValue = value.replace(/\$([A-Z_]+)/g, '${process.env.$1}')
          return `    '${key}': \`${cleanValue}\``
        }
        return `    '${key}': '${value}'`
      })
      .join(',\n')
    fetchOptions.push(`  headers: {\n${headerLines}\n  }`)
  }

  const exampleBody = getExampleBody(endpoint)
  if (exampleBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    fetchOptions.push(`  body: JSON.stringify(${JSON.stringify(exampleBody, null, 4)})`)
  }

  let code: string
  if (fetchOptions.length > 0) {
    code = `const response = await fetch('${url}', {
${fetchOptions.join(',\n')}
})

const data = await response.json()
console.log(data)`
  } else {
    code = `const response = await fetch('${url}')
const data = await response.json()
console.log(data)`
  }

  return {
    format: 'fetch',
    code,
    language: 'javascript',
  }
}

function generatePython(options: SnippetOptions): GeneratedSnippet {
  const { endpoint, baseUrl, auth } = options
  const url = buildUrl(baseUrl, endpoint)

  const lines: string[] = [
    'import requests',
    'import os',
    '',
  ]

  // Build headers
  const headers: string[] = []
  if (auth?.headerName && auth.headerValue) {
    const envVar = auth.envVarName
    if (auth.headerValue.includes('Bearer')) {
      headers.push(`    "${auth.headerName}": f"Bearer {os.environ['${envVar}']}"`)
    } else {
      headers.push(`    "${auth.headerName}": os.environ['${envVar}']`)
    }
  }

  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    headers.push(`    "Content-Type": "application/json"`)
  }

  if (headers.length > 0) {
    lines.push(`headers = {`)
    lines.push(headers.join(',\n'))
    lines.push(`}`)
    lines.push('')
  }

  // Build request
  const method = endpoint.method.toLowerCase()
  const exampleBody = getExampleBody(endpoint)

  if (exampleBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    lines.push(`data = ${JSON.stringify(exampleBody, null, 4)}`)
    lines.push('')
    lines.push(`response = requests.${method}(`)
    lines.push(`    "${url}",`)
    if (headers.length > 0) {
      lines.push(`    headers=headers,`)
    }
    lines.push(`    json=data`)
    lines.push(`)`)
  } else {
    if (headers.length > 0) {
      lines.push(`response = requests.${method}("${url}", headers=headers)`)
    } else {
      lines.push(`response = requests.${method}("${url}")`)
    }
  }

  lines.push('')
  lines.push('print(response.json())')

  return {
    format: 'python',
    code: lines.join('\n'),
    language: 'python',
  }
}

function buildUrl(baseUrl: string, endpoint: ParsedEndpoint): string {
  let url = baseUrl.replace(/\/$/, '') + endpoint.path

  // Replace path parameters with placeholders
  for (const param of endpoint.parameters) {
    if (param.in === 'path') {
      const placeholder = param.example || `{${param.name}}`
      url = url.replace(`{${param.name}}`, String(placeholder))
    }
  }

  // Add required query parameters
  const queryParams = endpoint.parameters.filter(
    (p) => p.in === 'query' && p.required
  )

  if (queryParams.length > 0) {
    const queryString = queryParams
      .map((p) => `${p.name}=${p.example || `{${p.name}}`}`)
      .join('&')
    url += `?${queryString}`
  }

  return url
}

function getExampleBody(endpoint: ParsedEndpoint): Record<string, unknown> | null {
  if (!endpoint.requestBody) return null

  const jsonContent =
    endpoint.requestBody.content['application/json'] ||
    endpoint.requestBody.content['*/*']

  if (!jsonContent) return null

  // Try to get example
  if (jsonContent.example) {
    return jsonContent.example as Record<string, unknown>
  }

  // Try to build from schema
  if (jsonContent.schema) {
    return buildExampleFromSchema(jsonContent.schema as Record<string, unknown>)
  }

  return null
}

function buildExampleFromSchema(
  schema: Record<string, unknown>
): Record<string, unknown> | null {
  if (schema.example) {
    return schema.example as Record<string, unknown>
  }

  if (schema.type !== 'object' || !schema.properties) {
    return null
  }

  const properties = schema.properties as Record<string, Record<string, unknown>>
  const required = (schema.required as string[]) || []
  const result: Record<string, unknown> = {}

  for (const [key, prop] of Object.entries(properties)) {
    // Only include required properties in the example
    if (!required.includes(key)) continue

    if (prop.example !== undefined) {
      result[key] = prop.example
    } else if (prop.default !== undefined) {
      result[key] = prop.default
    } else {
      // Generate placeholder based on type
      result[key] = getPlaceholder(prop)
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

function getPlaceholder(schema: Record<string, unknown>): unknown {
  const type = schema.type as string
  const format = schema.format as string | undefined

  switch (type) {
    case 'string':
      if (format === 'email') return 'user@example.com'
      if (format === 'date') return '2025-01-01'
      if (format === 'date-time') return '2025-01-01T00:00:00Z'
      if (format === 'uri' || format === 'url') return 'https://example.com'
      if (format === 'uuid') return '550e8400-e29b-41d4-a716-446655440000'
      return 'string'
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return true
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return null
  }
}
