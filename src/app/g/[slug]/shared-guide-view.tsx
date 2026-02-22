'use client';

import { Eye, FileCode, Key, Server, Share2, Terminal, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { CodeBlock } from '@/components/code-block';
import { EndpointSelector } from '@/components/endpoint-selector';
import { TryItPanel } from '@/components/try-it-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { detectAuth, generateSnippets, getAlternativeEndpoints } from '@/lib/openapi';
import type { ParsedEndpoint, ParsedSpec, SnippetFormat } from '@/types/openapi';

interface SharedGuideViewProps {
	spec: ParsedSpec;
	initialEndpoint: ParsedEndpoint;
	slug: string;
	viewCount: number;
}

export function SharedGuideView({ spec, initialEndpoint, slug, viewCount }: SharedGuideViewProps) {
	const [selectedEndpoint, setSelectedEndpoint] = useState(initialEndpoint);
	const [activeFormat, setActiveFormat] = useState<SnippetFormat>('curl');
	const [showTryIt, setShowTryIt] = useState(false);
	const [copied, setCopied] = useState(false);

	const baseUrl = spec.servers[0]?.url || 'https://api.example.com';

	const auth = useMemo(() => detectAuth(spec, selectedEndpoint), [spec, selectedEndpoint]);

	const snippets = useMemo(
		() =>
			generateSnippets({
				endpoint: selectedEndpoint,
				baseUrl,
				auth,
			}),
		[selectedEndpoint, baseUrl, auth],
	);

	const alternativeEndpoints = useMemo(
		() => [selectedEndpoint, ...getAlternativeEndpoints(spec, selectedEndpoint, 4)],
		[spec, selectedEndpoint],
	);

	const shareUrl =
		typeof window !== 'undefined' ? `${window.location.origin}/g/${slug}` : `/g/${slug}`;

	const handleCopyLink = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}, [shareUrl]);

	return (
		<div className="w-full max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Link href="/">
					<Button variant="ghost" className="gap-2 hover:text-primary">
						<Zap className="h-4 w-4 text-primary" />
						Runway
					</Button>
				</Link>
				<div className="flex items-center gap-3">
					<Badge variant="secondary" className="gap-1 bg-primary-muted text-primary">
						<Eye className="h-3 w-3" />
						{viewCount} views
					</Badge>
					<Button
						variant="outline"
						onClick={handleCopyLink}
						className="gap-2 border-primary/30 hover:bg-primary-muted"
					>
						<Share2 className="h-4 w-4" />
						{copied ? 'Copied!' : 'Share'}
					</Button>
				</div>
			</div>

			{/* API Info */}
			<Card className="border-l-4 border-l-primary shadow-sm">
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle className="text-2xl flex items-center gap-2">
								<Zap className="h-6 w-6 text-primary" />
								{spec.title}
							</CardTitle>
							<p className="text-sm text-muted-foreground mt-1">v{spec.version}</p>
						</div>
						<Badge
							variant="outline"
							className="flex items-center gap-1 border-primary/30 text-primary"
						>
							<Server className="h-3 w-3" />
							{baseUrl}
						</Badge>
					</div>
					{spec.description && <p className="text-muted-foreground mt-2">{spec.description}</p>}
				</CardHeader>
			</Card>

			{/* Endpoint Selector */}
			<Card>
				<CardContent className="pt-6">
					<EndpointSelector
						endpoints={alternativeEndpoints}
						selected={selectedEndpoint}
						onSelect={setSelectedEndpoint}
					/>
				</CardContent>
			</Card>

			{/* Step 1: Auth Setup */}
			{auth && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Key className="h-5 w-5" />
							Step 1: Set up authentication
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Badge variant="secondary">{auth.scheme.type}</Badge>
								{auth.scheme.scheme && <Badge variant="outline">{auth.scheme.scheme}</Badge>}
							</div>
							<CodeBlock
								code={auth.setupInstructions.join('\n')}
								language="bash"
								title="Terminal"
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 2: First Request */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Terminal className="h-5 w-5" />
						{auth ? 'Step 2: Make your first request' : 'Step 1: Make your first request'}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Badge variant="outline" className={getMethodColor(selectedEndpoint.method)}>
							{selectedEndpoint.method}
						</Badge>
						<code className="font-mono">{selectedEndpoint.path}</code>
						{selectedEndpoint.summary && (
							<>
								<Separator orientation="vertical" className="h-4" />
								<span>{selectedEndpoint.summary}</span>
							</>
						)}
					</div>

					<Tabs value={activeFormat} onValueChange={(v) => setActiveFormat(v as SnippetFormat)}>
						<TabsList>
							<TabsTrigger value="curl" className="gap-1">
								<Terminal className="h-3 w-3" />
								curl
							</TabsTrigger>
							<TabsTrigger value="fetch" className="gap-1">
								<FileCode className="h-3 w-3" />
								JavaScript
							</TabsTrigger>
							<TabsTrigger value="python" className="gap-1">
								<FileCode className="h-3 w-3" />
								Python
							</TabsTrigger>
						</TabsList>

						{snippets.map((snippet) => (
							<TabsContent key={snippet.format} value={snippet.format}>
								<CodeBlock code={snippet.code} language={snippet.language} />
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			{/* Step 3: Try It */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Zap className="h-5 w-5" />
						{auth ? 'Step 3: Try it live' : 'Step 2: Try it live'}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{showTryIt ? (
						<TryItPanel endpoint={selectedEndpoint} baseUrl={baseUrl} auth={auth} />
					) : (
						<Button
							onClick={() => setShowTryIt(true)}
							className="w-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
						>
							<Zap className="mr-2 h-4 w-4" />
							Open Interactive Tester
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Footer CTA */}
			<Card className="gradient-cta border-primary/20 shadow-sm">
				<CardContent className="py-6 text-center">
					<p className="text-sm text-muted-foreground mb-3">
						Powered by <span className="font-semibold text-primary">Runway</span>
					</p>
					<Link href="/">
						<Button className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
							Create your own Quick Start guide
						</Button>
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}

function getMethodColor(method: string): string {
	const colors: Record<string, string> = {
		GET: 'bg-green-500/10 text-green-700 border-green-500/20',
		POST: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
		PUT: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
		PATCH: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
		DELETE: 'bg-red-500/10 text-red-700 border-red-500/20',
	};
	return colors[method] || '';
}
