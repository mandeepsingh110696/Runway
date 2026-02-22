'use client';

import {
	ArrowRight,
	Check,
	Clock,
	Code2,
	ExternalLink,
	Globe,
	Rocket,
	Share2,
	Terminal,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const EXAMPLE_SPECS = [
	{ name: 'Petstore', url: 'https://petstore3.swagger.io/api/v3/openapi.json' },
	{ name: 'httpbin', url: 'https://httpbin.org/spec.json' },
];

const FEATURES = [
	{
		icon: Clock,
		title: 'Instant Quick Starts',
		description: 'Paste any OpenAPI URL and get copy-paste code in seconds, not hours.',
	},
	{
		icon: Code2,
		title: 'Multiple Languages',
		description: 'curl, JavaScript, and Python snippets ready to run.',
	},
	{
		icon: Share2,
		title: 'Shareable Links',
		description: 'Share your Quick Start guides with teammates or embed in docs.',
	},
	{
		icon: Zap,
		title: 'Try It Live',
		description: 'Test endpoints directly from the browser with real requests.',
	},
];

const COMPARISON = [
	{
		feature: 'Time to first API call',
		runway: '< 30 seconds',
		postman: '5-10 minutes',
		swagger: '2-5 minutes',
	},
	{ feature: 'Setup required', runway: 'None', postman: 'Download app', swagger: 'Host yourself' },
	{ feature: 'Shareable links', runway: 'Yes', postman: 'Paid feature', swagger: 'No' },
	{ feature: 'Copy-paste snippets', runway: '3 languages', postman: 'Many', swagger: 'curl only' },
	{ feature: 'Beautiful UI', runway: 'Yes', postman: 'Complex', swagger: 'Basic' },
];

export default function LandingPage() {
	const router = useRouter();
	const [specUrl, setSpecUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!specUrl.trim()) return;

			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch('/api/parse', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ input: specUrl }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to parse spec');
				}

				if (data.slug) {
					router.push(`/g/${data.slug}`);
				} else {
					router.push('/app');
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Something went wrong');
				setIsLoading(false);
			}
		},
		[specUrl, router],
	);

	const handleExampleClick = useCallback(
		async (url: string) => {
			setSpecUrl(url);
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch('/api/parse', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ input: url }),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to parse spec');
				}

				if (data.slug) {
					router.push(`/g/${data.slug}`);
				} else {
					router.push('/app');
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Something went wrong');
				setIsLoading(false);
			}
		},
		[router],
	);

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 gradient-hero" />
				<div className="relative container mx-auto px-4 py-24 md:py-32">
					<div className="max-w-3xl mx-auto text-center space-y-8">
						{/* Badge */}
						<Badge
							variant="secondary"
							className="text-sm px-4 py-1.5 bg-primary-muted text-primary border-primary/20"
						>
							<Rocket className="h-3 w-3 mr-1" />
							From OpenAPI to API call in seconds
						</Badge>

						{/* Headline */}
						<h1 className="text-4xl md:text-6xl font-bold tracking-tight">
							Your first API call,{' '}
							<span className="text-gradient">before your coffee gets cold</span>
						</h1>

						{/* Subheadline */}
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Paste any OpenAPI spec URL. Get instant, copy-paste code snippets. Test it live. Share
							with your team. No signup required.
						</p>

						{/* Input Form */}
						<form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
							<div className="flex gap-2">
								<Input
									type="url"
									placeholder="https://api.example.com/openapi.json"
									value={specUrl}
									onChange={(e) => setSpecUrl(e.target.value)}
									className="flex-1 h-12 text-base"
									disabled={isLoading}
								/>
								<Button
									type="submit"
									size="lg"
									disabled={isLoading || !specUrl.trim()}
									className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
								>
									{isLoading ? (
										<span className="flex items-center gap-2">
											<span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
											Generating...
										</span>
									) : (
										<span className="flex items-center gap-2">
											Generate <ArrowRight className="h-4 w-4" />
										</span>
									)}
								</Button>
							</div>

							{error && <p className="text-sm text-destructive text-left">{error}</p>}

							<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
								<span>Try it:</span>
								{EXAMPLE_SPECS.map((spec) => (
									<button
										key={spec.name}
										type="button"
										onClick={() => handleExampleClick(spec.url)}
										className="text-primary font-medium hover:underline underline-offset-2"
										disabled={isLoading}
									>
										{spec.name}
									</button>
								))}
							</div>
						</form>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="container mx-auto px-4 py-24">
				<div className="text-center mb-16">
					<h2 className="text-3xl font-bold mb-4">Why developers love Runway</h2>
					<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
						Stop reading API docs for hours. Start making requests in seconds.
					</p>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
					{FEATURES.map((feature) => (
						<Card
							key={feature.title}
							className="border-2 border-border hover:border-primary/30 bg-card hover:bg-primary-muted/30 transition-all duration-200 shadow-sm hover:shadow-md"
						>
							<CardHeader>
								<div className="h-12 w-12 rounded-xl bg-primary-muted flex items-center justify-center mb-2">
									<feature.icon className="h-6 w-6 text-primary" />
								</div>
								<CardTitle className="text-lg">{feature.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-base">{feature.description}</CardDescription>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* How It Works Section */}
			<section className="bg-primary-muted/20 py-24">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold mb-4">How it works</h2>
						<p className="text-muted-foreground text-lg">
							Three steps. Thirty seconds. First API call done.
						</p>
					</div>

					<div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
						{[
							{
								step: '1',
								title: 'Paste your OpenAPI URL',
								description: 'Any valid OpenAPI 3.x or Swagger 2.x spec URL works.',
								icon: Globe,
							},
							{
								step: '2',
								title: 'Get instant snippets',
								description: 'Copy-paste code for curl, JavaScript, or Python.',
								icon: Terminal,
							},
							{
								step: '3',
								title: 'Test & share',
								description: 'Try it live in browser or share the link with your team.',
								icon: Share2,
							},
						].map((item) => (
							<div key={item.step} className="text-center space-y-4">
								<div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
									{item.step}
								</div>
								<item.icon className="h-8 w-8 text-primary/80 mx-auto" />
								<h3 className="text-xl font-semibold">{item.title}</h3>
								<p className="text-muted-foreground">{item.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Comparison Table */}
			<section className="container mx-auto px-4 py-24">
				<div className="text-center mb-16">
					<h2 className="text-3xl font-bold mb-4">Runway vs. the alternatives</h2>
					<p className="text-muted-foreground text-lg">
						Postman for your first 5 minutes with an API
					</p>
				</div>

				<div className="max-w-4xl mx-auto overflow-x-auto">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
								<th className="text-center py-4 px-4 font-semibold text-primary bg-primary-muted/30">
									Runway
								</th>
								<th className="text-center py-4 px-4 font-medium text-muted-foreground">Postman</th>
								<th className="text-center py-4 px-4 font-medium text-muted-foreground">
									Swagger UI
								</th>
							</tr>
						</thead>
						<tbody>
							{COMPARISON.map((row) => (
								<tr
									key={row.feature}
									className="border-b border-border hover:bg-muted/30 transition-colors"
								>
									<td className="py-4 px-4">{row.feature}</td>
									<td className="text-center py-4 px-4 bg-primary-muted/10">
										<span className="inline-flex items-center gap-1 text-primary font-medium">
											{row.runway === 'Yes' ? <Check className="h-4 w-4" /> : row.runway}
										</span>
									</td>
									<td className="text-center py-4 px-4 text-muted-foreground">{row.postman}</td>
									<td className="text-center py-4 px-4 text-muted-foreground">{row.swagger}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			{/* CTA Section */}
			<section className="gradient-cta py-24 border-y border-primary/10">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-3xl font-bold mb-4">Ready to make your first API call?</h2>
					<p className="text-muted-foreground text-lg mb-8">
						No signup. No download. Just paste and go.
					</p>
					<Link href="/app">
						<Button
							size="lg"
							className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
						>
							<Zap className="h-5 w-5" />
							Open Runway
							<ArrowRight className="h-5 w-5" />
						</Button>
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-12 bg-muted/30">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<Zap className="h-5 w-5 text-primary" />
							<span className="font-semibold">Runway</span>
						</div>
						<div className="flex items-center gap-6 text-sm text-muted-foreground">
							<Link href="/app" className="hover:text-primary transition-colors">
								App
							</Link>
							<a
								href="https://github.com"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:text-primary transition-colors flex items-center gap-1"
							>
								GitHub <ExternalLink className="h-3 w-3" />
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
