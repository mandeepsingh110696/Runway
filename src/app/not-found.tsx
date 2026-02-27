import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Zap } from 'lucide-react';

export default function NotFound() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
			<div className="text-center space-y-6 max-w-md">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-muted/30 border border-primary/20">
					<FileQuestion className="h-10 w-10 text-primary" />
				</div>
				<div>
					<h1 className="text-4xl font-bold tracking-tight text-foreground">404</h1>
					<p className="mt-2 text-muted-foreground">
						This page doesn&apos;t exist or the guide may have been removed.
					</p>
				</div>
				<Link href="/">
					<Button className="gap-2" size="lg">
						<Zap className="h-4 w-4" />
						Back to Runway
					</Button>
				</Link>
			</div>
		</main>
	);
}
