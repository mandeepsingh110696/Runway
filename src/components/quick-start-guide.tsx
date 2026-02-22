'use client';

import { ArrowLeft, Download, FileCode, Key, Server, Terminal, Zap } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CodeBlock } from '@/components/code-block';
import { EndpointSelector } from '@/components/endpoint-selector';
import { ShareButton } from '@/components/share-button';
import { TryItPanel } from '@/components/try-it-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trackSnippetCopy, trackTryItUsed } from '@/lib/analytics';
import { detectAuth, generateSnippets, getAlternativeEndpoints } from '@/lib/openapi';
import type { ParsedEndpoint, ParsedSpec, SnippetFormat } from '@/types/openapi';

interface QuickStartGuideProps {
	spec: ParsedSpec;
	initialEndpoint: ParsedEndpoint;
	onReset: () => void;
	slug?: string | null;
	specUrl?: string | null;
}

export function QuickStartGuide({
	spec,
	initialEndpoint,
	onReset,
	slug,
	specUrl,
}: QuickStartGuideProps) {
	const [selectedEndpoint, setSelectedEndpoint] = useState(initialEndpoint);
	const [activeFormat, setActiveFormat] = useState<SnippetFormat>('curl');
	const [showTryIt, setShowTryIt] = useState(false);

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

	const handleExportMarkdown = useCallback(() => {
		const markdown = generateMarkdown(spec, selectedEndpoint, auth, snippets);
		const blob = new Blob([markdown], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${spec.title.toLowerCase().replace(/\s+/g, '-')}-quickstart.md`;
		a.click();
		URL.revokeObjectURL(url);
	}, [spec, selectedEndpoint, auth, snippets]);

	return (
		<div className="w-full max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Button variant="ghost" onClick={onReset} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					New spec
				</Button>
				<div className="flex items-center gap-2">
					{slug && <ShareButton slug={slug} specUrl={specUrl} />}
					<Button variant="outline" onClick={handleExportMarkdown} className="gap-2">
						<Download className="h-4 w-4" />
						Export Markdown
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
			<Card className="shadow-sm">
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
				<Card className="shadow-sm bg-accent-muted/30 border-accent/20">
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Key className="h-5 w-5 text-primary" />
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
			<Card className="shadow-sm">
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Terminal className="h-5 w-5 text-primary" />
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
								<CodeBlock
									code={snippet.code}
									language={snippet.language}
									onCopy={() =>
										trackSnippetCopy(
											undefined,
											snippet.format as 'curl' | 'fetch' | 'python',
											specUrl,
										)
									}
								/>
							</TabsContent>
						))}
					</Tabs>
				</CardContent>
			</Card>

			{/* Step 3: Try It */}
			<Card className="shadow-sm border-primary/10">
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Zap className="h-5 w-5 text-primary" />
						{auth ? 'Step 3: Try it live' : 'Step 2: Try it live'}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{showTryIt ? (
						<TryItPanel
							endpoint={selectedEndpoint}
							baseUrl={baseUrl}
							auth={auth}
							onRequestSent={() =>
								trackTryItUsed(
									undefined,
									`${selectedEndpoint.method} ${selectedEndpoint.path}`,
									specUrl,
								)
							}
						/>
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

function generateMarkdown(
	spec: ParsedSpec,
	endpoint: ParsedEndpoint,
	auth: ReturnType<typeof detectAuth>,
	snippets: ReturnType<typeof generateSnippets>,
): string {
	const lines: string[] = [
		`# ${spec.title} Quick Start`,
		'',
		`> Generated by Runway`,
		'',
		`## API Info`,
		'',
		`- **Version:** ${spec.version}`,
		`- **Base URL:** ${spec.servers[0]?.url || 'N/A'}`,
		'',
	];

	if (auth) {
		lines.push(
			`## Step 1: Set up authentication`,
			'',
			'```bash',
			auth.setupInstructions.join('\n'),
			'```',
			'',
		);
	}

	lines.push(
		`## ${auth ? 'Step 2' : 'Step 1'}: Make your first request`,
		'',
		`**${endpoint.method}** \`${endpoint.path}\``,
		'',
		endpoint.summary || '',
		'',
	);

	for (const snippet of snippets) {
		lines.push(`### ${snippet.format}`, '', `\`\`\`${snippet.language}`, snippet.code, '```', '');
	}

	return lines.join('\n');
}
