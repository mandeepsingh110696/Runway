'use client';

import { History } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QuickStartGuide } from '@/components/quick-start-guide';
import { SpecInput } from '@/components/spec-input';
import { Button } from '@/components/ui/button';
import type { ParsedEndpoint, ParsedSpec } from '@/types/openapi';

const RECENT_SPECS_KEY = 'runway-recent-specs';
const RECENT_SPECS_MAX = 10;

interface ParseResult {
	spec: ParsedSpec;
	bestEndpoint: ParsedEndpoint;
	slug: string | null;
	specUrl: string | null;
}

function loadRecentSpecs(): string[] {
	try {
		const s = localStorage.getItem(RECENT_SPECS_KEY);
		if (s) return JSON.parse(s) as string[];
	} catch {
		// ignore
	}
	return [];
}

function saveRecentSpecs(urls: string[]) {
	try {
		localStorage.setItem(RECENT_SPECS_KEY, JSON.stringify(urls));
	} catch {
		// ignore
	}
}

export default function AppPage() {
	const [result, setResult] = useState<ParseResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recentSpecs, setRecentSpecs] = useState<string[]>([]);

	useEffect(() => {
		setRecentSpecs(loadRecentSpecs());
	}, []);

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
			if (input.startsWith('http')) {
				setRecentSpecs((prev) => {
					const next = [input, ...prev.filter((u) => u !== input)].slice(0, RECENT_SPECS_MAX);
					saveRecentSpecs(next);
					return next;
				});
			}
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
				<div className="flex flex-col items-center min-h-[80vh] gap-8">
					<div className="flex items-center justify-center flex-1 w-full">
						<SpecInput onSubmit={handleSubmit} isLoading={isLoading} error={error} />
					</div>
					{recentSpecs.length > 0 && (
						<div className="w-full max-w-2xl mx-auto border-t border-border pt-6">
							<p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
								<History className="h-3.5 w-3.5" />
								Recently used
							</p>
							<div className="flex flex-wrap gap-2">
								{recentSpecs.map((url) => {
									const label = url.replace(/^https?:\/\//, '').split('/')[0];
									return (
										<button
											key={url}
											type="button"
											onClick={() => handleSubmit(url)}
											disabled={isLoading}
											className="text-xs text-muted-foreground hover:text-foreground font-mono px-2.5 py-1.5 rounded-md bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-colors truncate max-w-[240px]"
											title={url}
										>
											{label}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>
			)}
		</main>
	);
}
