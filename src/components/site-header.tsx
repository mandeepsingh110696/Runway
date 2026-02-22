'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';
import { UserNav } from '@/components/auth';

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/90 backdrop-blur-md shadow-black/20 shadow-sm">
			<div className="container flex h-14 items-center justify-between px-4">
				<Link
					href="/"
					className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
				>
					<Zap className="h-5 w-5 text-primary" />
					Runway
				</Link>
				<nav className="flex items-center gap-4">
					<Link
						href="/app"
						className="text-sm text-muted-foreground hover:text-primary transition-colors"
					>
						App
					</Link>
					<UserNav />
				</nav>
			</div>
		</header>
	);
}
