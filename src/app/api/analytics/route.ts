import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { extractDomain } from '@/lib/utils/slug';

export async function POST(request: Request) {
	try {
		const { guideId, eventType, specUrl, metadata } = await request.json();

		if (!eventType) {
			return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
		}

		const cookieStore = await cookies();
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll() {},
				},
			},
		);

		const domain = extractDomain(specUrl);

		const { error } = await supabase.from('events').insert({
			guide_id: guideId ?? null,
			event_type: eventType,
			api_domain: domain,
			metadata: metadata ?? {},
		});

		if (error) {
			console.error('Analytics insert error:', error);
			return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Analytics error:', error);
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
	}
}
