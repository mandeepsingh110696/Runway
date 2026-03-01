'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { QuickStartGuide } from '@/components/quick-start-guide';
import { SpecInput } from '@/components/spec-input';
import type { ParsedEndpoint, ParsedSpec } from '@/types/openapi';

interface ParseResult {
	spec: ParsedSpec;
	bestEndpoint: ParsedEndpoint;
	slug: string | null;
	specUrl: string | null;
}

export default function AppPage() {
	const [result, setResult] = useState<ParseResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(async (input: string) => {
		setIsLoading(true);
		setError(null);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s max wait

		try {
			const response = await fetch('/api/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ input }),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const data = await response.json();

			if (!response.ok) {
				const msg = typeof data?.error === 'string' ? data.error : 'Something went wrong';
				if (response.status === 429) {
					setError('Too many requests. Please wait a minute and try again.');
					return;
				}
				setError(msg);
				return;
			}

			setResult({
				...data,
				specUrl: input.startsWith('http') ? input : null,
			});
			if (data.slug) toast.success('Guide saved — share the link to reuse it');
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				setError("Request took too long. Try a different URL or paste the OpenAPI JSON.");
			} else {
				setError(
					err instanceof Error ? err.message : "Couldn't load spec. Check the URL or try again.",
				);
			}
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleReset = useCallback(() => {
		setResult(null);
		setError(null);
	}, []);

	return (
		<main className="min-h-screen py-12 px-4">
			{result ? (
				<QuickStartGuide
					spec={result.spec}
					initialEndpoint={result.bestEndpoint}
					onReset={handleReset}
					slug={result.slug}
					specUrl={result.specUrl}
				/>
			) : (
				<div className="flex items-center justify-center min-h-[80vh]">
					<SpecInput onSubmit={handleSubmit} isLoading={isLoading} error={error} />
				</div>
			)}
		</main>
	);
}
