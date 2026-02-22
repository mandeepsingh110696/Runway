import { NextResponse } from 'next/server';
import { pickBestEndpoint } from '@/lib/openapi';
import { parseOpenAPISpec } from '@/lib/openapi/parser';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractDomain, generateSlug } from '@/lib/utils/slug';

export async function POST(request: Request) {
	try {
		const { input, save = true } = await request.json();

		if (!input || typeof input !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid input: expected a URL or JSON string' },
				{ status: 400 },
			);
		}

		const spec = await parseOpenAPISpec(input);
		const bestEndpoint = pickBestEndpoint(spec);

		if (!bestEndpoint) {
			return NextResponse.json(
				{ error: 'No endpoints found in the OpenAPI spec' },
				{ status: 400 },
			);
		}

		let slug: string | null = null;

		if (save) {
			const supabase = await createAdminClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			const specUrl = input.startsWith('http') ? input : null;
			slug = generateSlug();

			const { error: insertError } = await supabase.from('guides').insert({
				slug,
				api_name: spec.title,
				spec_url: specUrl,
				parsed_data: { spec, bestEndpoint },
				user_id: user?.id ?? null,
			});

			if (insertError) {
				console.error('Failed to save guide:', insertError);
				slug = null;
			} else {
				const domain = extractDomain(specUrl);
				if (domain) {
					await supabase.from('events').insert({
						guide_id: null,
						event_type: 'guide_created',
						api_domain: domain,
						metadata: { api_name: spec.title },
					});
				}
			}
		}

		return NextResponse.json({
			spec,
			bestEndpoint,
			slug,
		});
	} catch (error) {
		console.error('Parse error:', error);

		const message = error instanceof Error ? error.message : 'Failed to parse OpenAPI spec';

		return NextResponse.json({ error: message }, { status: 400 });
	}
}
