import { NextResponse } from 'next/server'

interface ProxyRequest {
  url: string
  method: string
  headers?: Record<string, string>
  body?: unknown
}

export async function POST(request: Request) {
  try {
    const { url, method, headers, body }: ProxyRequest = await request.json()

    if (!url || !method) {
      return NextResponse.json(
        { error: 'Missing url or method' },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      )
    }

    // Only allow HTTPS in production
    if (
      process.env.NODE_ENV === 'production' &&
      parsedUrl.protocol !== 'https:'
    ) {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    // Block localhost and private IPs
    const hostname = parsedUrl.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return NextResponse.json(
        { error: 'Cannot proxy to localhost or private IPs' },
        { status: 400 }
      )
    }

    // Make the request
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        // Add a user agent
        'User-Agent': 'Runway/1.0 (API Testing Tool)',
      },
    }

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = JSON.stringify(body)
    }

    const startTime = Date.now()
    const response = await fetch(url, fetchOptions)
    const duration = Date.now() - startTime

    // Get response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // Try to parse as JSON, fall back to text
    let data: unknown
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      try {
        data = await response.json()
      } catch {
        data = await response.text()
      }
    } else {
      data = await response.text()
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data,
      duration,
    })
  } catch (error) {
    console.error('Proxy error:', error)

    const message =
      error instanceof Error ? error.message : 'Failed to proxy request'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
