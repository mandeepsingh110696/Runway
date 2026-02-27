'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
			<div className="text-center space-y-6 max-w-md">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20">
					<AlertCircle className="h-10 w-10 text-destructive" />
				</div>
				<div>
					<h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						We hit an unexpected error. You can try again or head back home.
					</p>
				</div>
				<div className="flex flex-wrap gap-3 justify-center">
					<Button variant="outline" onClick={reset}>
						Try again
					</Button>
					<Link href="/">
						<Button>Go home</Button>
					</Link>
				</div>
			</div>
		</main>
	);
}
