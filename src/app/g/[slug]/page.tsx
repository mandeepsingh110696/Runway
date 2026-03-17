import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { SharedGuideView } from './shared-guide-view';

interface PageProps {
	params: Promise<{ slug: string }>;
}

interface GuideRow {
	id: string;
	slug: string;
	api_name: string;
	spec_url: string | null;
	parsed_data: unknown;
	created_at: string;
	user_id: string | null;
	view_count: number;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://runway.dev';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const supabase = await createAdminClient();

	const { data: guide } = await supabase
		.from('guides')
		.select('api_name')
		.eq('slug', slug)
		.single<{ api_name: string }>();

	if (!guide) {
		return { title: 'Guide Not Found - Runway' };
	}

	const title = `${guide.api_name} Quick Start - Runway`;
	const description = `Get started with the ${guide.api_name} API in seconds. Copy-paste code for curl, JavaScript, Node, Python, and Go.`;
	const canonicalPath = `/g/${slug}`;
	const fullUrl = `${APP_URL.replace(/\/$/, '')}${canonicalPath}`;

	return {
		title,
		description,
		alternates: { canonical: canonicalPath },
		openGraph: {
			title,
			description,
			url: fullUrl,
			type: 'article',
			siteName: 'Runway',
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
		},
	};
}

export default async function SharedGuidePage({ params }: PageProps) {
	const { slug } = await params;
	const supabase = await createAdminClient();

	const { data: guide, error } = await supabase
		.from('guides')
		.select('*')
		.eq('slug', slug)
		.single<GuideRow>();

	if (error || !guide) {
		notFound();
	}

	await supabase.rpc('increment_view_count', { guide_slug: slug });

	const parsedData = guide.parsed_data as {
		spec: Parameters<typeof SharedGuideView>[0]['spec'];
		bestEndpoint: Parameters<typeof SharedGuideView>[0]['initialEndpoint'];
	};

	return (
		<main className="min-h-screen py-12 px-4">
			<SharedGuideView
				spec={parsedData.spec}
				initialEndpoint={parsedData.bestEndpoint}
				slug={slug}
				viewCount={guide.view_count}
			/>
		</main>
	);
}
