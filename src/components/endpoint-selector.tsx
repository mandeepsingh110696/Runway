'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ParsedEndpoint } from '@/types/openapi'

interface EndpointSelectorProps {
  endpoints: ParsedEndpoint[]
  selected: ParsedEndpoint
  onSelect: (endpoint: ParsedEndpoint) => void
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-700 border-green-500/20',
  POST: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  PUT: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  PATCH: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-700 border-red-500/20',
}

export function EndpointSelector({
  endpoints,
  selected,
  onSelect,
}: EndpointSelectorProps) {
  const isSelected = (endpoint: ParsedEndpoint) =>
    endpoint.path === selected.path && endpoint.method === selected.method

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Select endpoint
      </h3>
      <div className="flex flex-wrap gap-2">
        {endpoints.map((endpoint) => {
          const key = `${endpoint.method}-${endpoint.path}`
          return (
            <Button
              key={key}
              variant={isSelected(endpoint) ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelect(endpoint)}
              className="h-auto py-1.5 px-3"
            >
              <Badge
                variant="outline"
                className={`mr-2 ${METHOD_COLORS[endpoint.method] || ''}`}
              >
                {endpoint.method}
              </Badge>
              <span className="font-mono text-xs">{endpoint.path}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
