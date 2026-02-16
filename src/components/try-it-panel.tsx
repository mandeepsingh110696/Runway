'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CodeBlock } from '@/components/code-block'
import type { ParsedEndpoint } from '@/types/openapi'
import type { AuthInfo } from '@/lib/openapi/auth-detector'
import { Loader2, Send, AlertCircle, CheckCircle } from 'lucide-react'

interface TryItPanelProps {
  endpoint: ParsedEndpoint
  baseUrl: string
  auth: AuthInfo | null
}

interface ApiResponse {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
  duration: number
}

export function TryItPanel({ endpoint, baseUrl, auth }: TryItPanelProps) {
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSendRequest = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    const startTime = performance.now()

    try {
      // Build the request URL
      let url = baseUrl.replace(/\/$/, '') + endpoint.path

      // Replace path parameters with placeholders
      for (const param of endpoint.parameters) {
        if (param.in === 'path') {
          const placeholder = param.example || `example-${param.name}`
          url = url.replace(`{${param.name}}`, String(placeholder))
        }
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (auth && apiKey) {
        if (auth.headerName) {
          if (auth.headerValue.includes('Bearer')) {
            headers[auth.headerName] = `Bearer ${apiKey}`
          } else {
            headers[auth.headerName] = apiKey
          }
        }
      }

      // Make the request via our proxy
      const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: endpoint.method,
          headers,
        }),
      })

      const result = await proxyResponse.json()
      const duration = Math.round(performance.now() - startTime)

      if (result.error) {
        setError(result.error)
      } else {
        setResponse({
          status: result.status,
          statusText: result.statusText,
          data: result.data,
          headers: result.headers || {},
          duration,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsLoading(false)
    }
  }, [baseUrl, endpoint, auth, apiKey])

  return (
    <div className="space-y-4">
      {/* Auth input */}
      {auth && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {auth.scheme.type === 'apiKey' ? 'API Key' : 'Access Token'}
          </label>
          <Input
            type="password"
            placeholder={`Enter your ${auth.envVarName.toLowerCase().replace(/_/g, ' ')}`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your key is sent directly to the API and never stored.
          </p>
        </div>
      )}

      {/* Request info */}
      <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
        <Badge variant="outline" className={getMethodColor(endpoint.method)}>
          {endpoint.method}
        </Badge>
        <code className="text-sm font-mono flex-1 truncate">
          {baseUrl.replace(/\/$/, '')}{endpoint.path}
        </code>
      </div>

      {/* Send button */}
      <Button
        onClick={handleSendRequest}
        disabled={isLoading || (auth !== null && !apiKey)}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Send Request
          </>
        )}
      </Button>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1 text-sm text-destructive/90">{error}</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {response.status < 400 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <Badge
                variant={response.status < 400 ? 'default' : 'destructive'}
              >
                {response.status} {response.statusText}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {response.duration}ms
            </span>
          </div>

          <CodeBlock
            code={JSON.stringify(response.data, null, 2)}
            language="json"
            title="Response"
          />
        </div>
      )}
    </div>
  )
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/10 text-green-700 border-green-500/20',
    POST: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    PUT: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    PATCH: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
    DELETE: 'bg-red-500/10 text-red-700 border-red-500/20',
  }
  return colors[method] || ''
}
