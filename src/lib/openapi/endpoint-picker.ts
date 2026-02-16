import type { ParsedEndpoint, ParsedSpec } from '@/types/openapi'

/**
 * Smart endpoint selection heuristics
 * Prefers simple "hello world" endpoints that are easy to test
 */
export function pickBestEndpoint(spec: ParsedSpec): ParsedEndpoint | null {
  const { endpoints } = spec
  if (endpoints.length === 0) return null

  // Priority patterns for "hello world" endpoints
  const helloWorldPatterns = [
    /^\/health$/i,
    /^\/ping$/i,
    /^\/status$/i,
    /^\/me$/i,
    /^\/user$/i,
    /^\/users\/me$/i,
    /^\/api\/health$/i,
    /^\/api\/ping$/i,
    /^\/api\/status$/i,
    /^\/v\d+\/health$/i,
    /^\/v\d+\/me$/i,
  ]

  // Score each endpoint
  const scored = endpoints.map((endpoint) => ({
    endpoint,
    score: calculateScore(endpoint, helloWorldPatterns),
  }))

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored[0]?.endpoint || null
}

function calculateScore(
  endpoint: ParsedEndpoint,
  patterns: RegExp[]
): number {
  let score = 0

  // GET methods are preferred (easiest to test)
  if (endpoint.method === 'GET') score += 100

  // Prefer endpoints matching hello-world patterns
  for (let i = 0; i < patterns.length; i++) {
    if (patterns[i].test(endpoint.path)) {
      score += 50 - i // Earlier patterns get higher priority
      break
    }
  }

  // Fewer required parameters = easier to test
  const requiredParams = endpoint.parameters.filter((p) => p.required).length
  score -= requiredParams * 10

  // No request body = easier to test
  if (!endpoint.requestBody) score += 20

  // Shorter paths are often simpler
  const pathSegments = endpoint.path.split('/').filter(Boolean).length
  score -= pathSegments * 2

  // Endpoints with path parameters are harder to test
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path').length
  score -= pathParams * 15

  // Prefer endpoints with summaries (better documented)
  if (endpoint.summary) score += 5

  // Boost list endpoints (often simple)
  if (/^\/[a-z]+s?$/i.test(endpoint.path)) score += 10

  return score
}

export function getAlternativeEndpoints(
  spec: ParsedSpec,
  selected: ParsedEndpoint,
  limit = 5
): ParsedEndpoint[] {
  return spec.endpoints
    .filter(
      (e) => !(e.path === selected.path && e.method === selected.method)
    )
    .slice(0, limit)
}
