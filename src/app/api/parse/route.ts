import { NextResponse } from 'next/server'
import { parseOpenAPISpec } from '@/lib/openapi/parser'
import { pickBestEndpoint } from '@/lib/openapi'

export async function POST(request: Request) {
  try {
    const { input } = await request.json()

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: expected a URL or JSON string' },
        { status: 400 }
      )
    }

    const spec = await parseOpenAPISpec(input)
    const bestEndpoint = pickBestEndpoint(spec)

    if (!bestEndpoint) {
      return NextResponse.json(
        { error: 'No endpoints found in the OpenAPI spec' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      spec,
      bestEndpoint,
    })
  } catch (error) {
    console.error('Parse error:', error)

    const message =
      error instanceof Error ? error.message : 'Failed to parse OpenAPI spec'

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
