'use client';

import { AlertCircle, FileJson, Link, Loader2, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

function isValidUrl(s: string): boolean {
	try {
		const u = new URL(s);
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
}

function isValidJson(s: string): boolean {
	s = s.trim();
	if (!s) return false;
	try {
		JSON.parse(s);
		return true;
	} catch {
		return false;
	}
}

interface SpecInputProps {
	onSubmit: (input: string) => void;
	isLoading: boolean;
	error: string | null;
}

// Sample APIs for quick testing (URLs must serve valid OpenAPI JSON)
const SAMPLE_APIS = [
	{
		name: 'PetStore',
		url: 'https://petstore3.swagger.io/api/v3/openapi.json',
		description: 'Classic Swagger example',
	},
	{
		name: 'HTTPBin',
		url: 'https://httpbin.org/spec.json',
		description: 'HTTP request testing',
	},
];

export function SpecInput({ onSubmit, isLoading, error }: SpecInputProps) {
	const [url, setUrl] = useState('');
	const [json, setJson] = useState('');
	const [activeTab, setActiveTab] = useState('url');
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleSubmit = useCallback(() => {
		setValidationError(null);
		const input = activeTab === 'url' ? url.trim() : json.trim();
		if (!input) return;
		if (activeTab === 'url' && !isValidUrl(input)) {
			setValidationError('Please enter a valid URL (e.g. https://api.example.com/openapi.json)');
			return;
		}
		if (activeTab === 'json' && !isValidJson(input)) {
			setValidationError('Please enter valid OpenAPI JSON.');
			return;
		}
		onSubmit(input);
	}, [activeTab, url, json, onSubmit]);

	const handleSampleClick = useCallback((sampleUrl: string) => {
		setUrl(sampleUrl);
		setActiveTab('url');
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && e.metaKey) {
				handleSubmit();
			}
		},
		[handleSubmit],
	);

	return (
		<Card className="w-full max-w-2xl mx-auto border-2 border-border shadow-lg shadow-primary/5">
			<CardHeader className="text-center pb-2">
				<CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
					<Zap className="h-8 w-8 text-primary" />
					Runway
				</CardTitle>
				<CardDescription className="text-lg">
					From OpenAPI spec to first API call in seconds
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setValidationError(null); }}>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="url" className="flex items-center gap-2">
							<Link className="h-4 w-4" />
							URL
						</TabsTrigger>
						<TabsTrigger value="json" className="flex items-center gap-2">
							<FileJson className="h-4 w-4" />
							Paste JSON
						</TabsTrigger>
					</TabsList>

					<TabsContent value="url" className="space-y-4">
						<div className="space-y-2">
							<Input
								type="url"
								placeholder="https://api.example.com/openapi.json"
								value={url}
								onChange={(e) => { setUrl(e.target.value); setValidationError(null); }}
								onKeyDown={handleKeyDown}
								disabled={isLoading}
								className="text-base"
							/>
						</div>

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Or try a sample:</p>
							<div className="flex flex-wrap gap-2">
								{SAMPLE_APIS.map((api) => (
									<Button
										key={api.name}
										variant="outline"
										size="sm"
										onClick={() => handleSampleClick(api.url)}
										disabled={isLoading}
									>
										{api.name}
									</Button>
								))}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="json" className="space-y-4">
						<Textarea
							placeholder='{"openapi": "3.0.0", ...}'
							value={json}
							onChange={(e) => { setJson(e.target.value); setValidationError(null); }}
							onKeyDown={handleKeyDown}
							disabled={isLoading}
							className="min-h-[200px] font-mono text-sm"
						/>
					</TabsContent>
				</Tabs>

				{error && (
					<div className="flex gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
						<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
						<div>
							<p className="font-medium">Couldn’t load spec</p>
							<p className="text-destructive/90 mt-0.5">{error}</p>
							<p className="text-muted-foreground mt-1.5 text-xs">
								Check the URL or try pasting the OpenAPI JSON in the Paste JSON tab.
							</p>
						</div>
					</div>
				)}

				{validationError && (
					<div className="flex gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm">
						<AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
						<p>{validationError}</p>
					</div>
				)}

				<Button
					onClick={handleSubmit}
					disabled={isLoading || (!url.trim() && !json.trim())}
					className="w-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
					size="lg"
				>
					{isLoading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Parsing spec...
						</>
					) : (
						<>
							<Zap className="mr-2 h-4 w-4" />
							Generate Quick Start
						</>
					)}
				</Button>

				<p className="text-xs text-center text-muted-foreground">Press ⌘+Enter to submit</p>
			</CardContent>
		</Card>
	);
}
