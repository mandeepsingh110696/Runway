export type EventType =
	| 'guide_created'
	| 'guide_viewed'
	| 'snippet_copied'
	| 'try_it_used'
	| 'guide_shared';

interface TrackEventOptions {
	guideId?: string;
	eventType: EventType;
	specUrl?: string | null;
	metadata?: Record<string, unknown>;
}

export async function trackEvent({
	guideId,
	eventType,
	specUrl,
	metadata = {},
}: TrackEventOptions): Promise<void> {
	try {
		await fetch('/api/analytics', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				guideId,
				eventType,
				specUrl,
				metadata,
			}),
		});
	} catch (error) {
		console.error('Failed to track event:', error);
	}
}

export async function trackSnippetCopy(
	guideId: string | undefined,
	format: 'curl' | 'fetch' | 'python',
	specUrl?: string | null,
): Promise<void> {
	await trackEvent({
		guideId,
		eventType: 'snippet_copied',
		specUrl,
		metadata: { format },
	});
}

export async function trackTryItUsed(
	guideId: string | undefined,
	endpoint: string,
	specUrl?: string | null,
): Promise<void> {
	await trackEvent({
		guideId,
		eventType: 'try_it_used',
		specUrl,
		metadata: { endpoint },
	});
}

export async function trackGuideShared(guideId: string, specUrl?: string | null): Promise<void> {
	await trackEvent({
		guideId,
		eventType: 'guide_shared',
		specUrl,
	});
}
