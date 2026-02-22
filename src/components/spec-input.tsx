'use client';

import { FileJson, Link, Loader2, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface SpecInputProps {
	onSubmit: (input: string) => void;
	isLoading: boolean;
	error: string | null;
}

// Sample APIs for quick testing
const SAMPLE_APIS = [
	{
		name: 'JSONPlaceholder',
		url: 'https://raw.githubusercontent.com/typicode/jsonplaceholder/master/public/openapi.json',
		description: 'Free fake API for testing',
	},
	{
		name: 'PetStore',
		url: 'https://petstore3.swagger.io/api/v3/openapi.json',
		description: 'Classic Swagger example',
	},
];

export function SpecInput({ onSubmit, isLoading, error }: SpecInputProps) {
	const [url, setUrl] = useState('');
	const [json, setJson] = useState('');
	const [activeTab, setActiveTab] = useState('url');

	const handleSubmit = useCallback(() => {
		const input = activeTab === 'url' ? url.trim() : json.trim();
		if (input) {
			onSubmit(input);
		}
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
				<Tabs value={activeTab} onValueChange={setActiveTab}>
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
								onChange={(e) => setUrl(e.target.value)}
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
							onChange={(e) => setJson(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={isLoading}
							className="min-h-[200px] font-mono text-sm"
						/>
					</TabsContent>
				</Tabs>

				{error && (
					<div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
				)}

				<Button
					onClick={handleSubmit}
					disabled={isLoading || (!url && !json)}
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
