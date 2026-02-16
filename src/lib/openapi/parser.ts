import * as OpenAPIParser from '@readme/openapi-parser'
import type {
  ParsedSpec,
  ParsedEndpoint,
  EndpointParameter,
  SecurityScheme,
  ServerInfo,
  RequestBody,
  ResponseInfo,
} from '@/types/openapi'

interface OpenAPIDocument {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: Array<{ url: string; description?: string }>
  host?: string
  basePath?: string
  schemes?: string[]
  paths: Record<string, Record<string, OperationObject>>
  components?: {
    securitySchemes?: Record<string, SecurityScheme>
  }
  securityDefinitions?: Record<string, SecurityScheme>
  security?: Array<Record<string, string[]>>
}

interface OperationObject {
  operationId?: string
  summary?: string
  description?: string
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject
  responses?: Record<string, ResponseObject>
  security?: Array<Record<string, string[]>>
  tags?: string[]
}

interface ParameterObject {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  description?: string
  schema?: Record<string, unknown>
  example?: unknown
}

interface RequestBodyObject {
  required?: boolean
  description?: string
  content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>
}

interface ResponseObject {
  description: string
  content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>
}

export async function parseOpenAPISpec(input: string): Promise<ParsedSpec> {
  let spec: OpenAPIDocument

  // Check if input is URL or JSON
  if (input.startsWith('http://') || input.startsWith('https://')) {
    // Use dereference to get the full document with resolved $refs
    spec = (await OpenAPIParser.dereference(input)) as unknown as OpenAPIDocument
  } else {
    // Try to parse as JSON
    const parsed = JSON.parse(input)
    spec = (await OpenAPIParser.dereference(parsed)) as unknown as OpenAPIDocument
  }

  return transformSpec(spec)
}

function transformSpec(spec: OpenAPIDocument): ParsedSpec {
  const servers = extractServers(spec)
  const securitySchemes = extractSecuritySchemes(spec)
  const endpoints = extractEndpoints(spec)
  const defaultSecurity = spec.security || []

  return {
    title: spec.info.title,
    version: spec.info.version,
    description: spec.info.description,
    servers,
    endpoints,
    securitySchemes,
    defaultSecurity,
  }
}

function extractServers(spec: OpenAPIDocument): ServerInfo[] {
  // OpenAPI 3.x
  if (spec.servers && spec.servers.length > 0) {
    return spec.servers.map((s) => ({
      url: s.url,
      description: s.description,
    }))
  }

  // Swagger 2.x
  if (spec.host) {
    const scheme = spec.schemes?.[0] || 'https'
    const basePath = spec.basePath || ''
    return [{ url: `${scheme}://${spec.host}${basePath}` }]
  }

  return [{ url: 'https://api.example.com' }]
}

function extractSecuritySchemes(
  spec: OpenAPIDocument
): Record<string, SecurityScheme> {
  // OpenAPI 3.x
  if (spec.components?.securitySchemes) {
    return spec.components.securitySchemes as Record<string, SecurityScheme>
  }

  // Swagger 2.x
  if (spec.securityDefinitions) {
    return spec.securityDefinitions as Record<string, SecurityScheme>
  }

  return {}
}

function extractEndpoints(spec: OpenAPIDocument): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = []
  const methods = ['get', 'post', 'put', 'patch', 'delete'] as const

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of methods) {
      const operation = pathItem[method] as OperationObject | undefined
      if (!operation) continue

      const parameters: EndpointParameter[] = (operation.parameters || []).map(
        (p) => ({
          name: p.name,
          in: p.in,
          required: p.required || false,
          description: p.description,
          schema: p.schema as EndpointParameter['schema'],
          example: p.example,
        })
      )

      const requestBody: RequestBody | undefined = operation.requestBody
        ? {
            required: operation.requestBody.required || false,
            description: operation.requestBody.description,
            content: (operation.requestBody.content || {}) as RequestBody['content'],
          }
        : undefined

      const responses: Record<string, ResponseInfo> = {}
      for (const [code, response] of Object.entries(operation.responses || {})) {
        responses[code] = {
          description: response.description,
          content: response.content as ResponseInfo['content'],
        }
      }

      endpoints.push({
        path,
        method: method.toUpperCase() as ParsedEndpoint['method'],
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        parameters,
        requestBody,
        responses,
        security: operation.security || [],
        tags: operation.tags || [],
      })
    }
  }

  return endpoints
}
