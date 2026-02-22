'use client';

import { useCallback, useState } from 'react';
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

		try {
			const response = await fetch('/api/parse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ input }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to parse spec');
			}

			setResult({
				...data,
				specUrl: input.startsWith('http') ? input : null,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
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
