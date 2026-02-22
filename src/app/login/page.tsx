'use client';

import { Github, Mail, Zap } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
	const searchParams = useSearchParams();
	const redirect = searchParams.get('redirect') || '/dashboard';
	const errorParam = searchParams.get('error');

	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
		errorParam ? { type: 'error', text: errorParam } : null,
	);

	const handleMagicLink = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!email.trim()) return;

			setIsLoading(true);
			setMessage(null);

			const supabase = createClient();
			const { error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
				},
			});

			setIsLoading(false);

			if (error) {
				setMessage({ type: 'error', text: error.message });
			} else {
				setMessage({ type: 'success', text: 'Check your email for the magic link!' });
				setEmail('');
			}
		},
		[email, redirect],
	);

	const handleGitHub = useCallback(async () => {
		setIsLoading(true);
		const supabase = createClient();
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'github',
			options: {
				redirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
			},
		});

		if (error) {
			setMessage({ type: 'error', text: error.message });
			setIsLoading(false);
		}
	}, [redirect]);

	return (
		<Card className="w-full max-w-md border-2 border-border shadow-lg shadow-primary/5">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 rounded-xl bg-primary-muted w-16 h-16 flex items-center justify-center">
					<Zap className="h-8 w-8 text-primary" />
				</div>
				<CardTitle className="text-2xl">Sign in to Runway</CardTitle>
				<CardDescription>Save your Quick Start guides and track usage</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{message && (
					<div
						className={`p-3 rounded-md text-sm ${
							message.type === 'success'
								? 'bg-green-500/10 text-green-700 border border-green-500/20'
								: 'bg-destructive/10 text-destructive border border-destructive/20'
						}`}
					>
						{message.text}
					</div>
				)}

				<Button
					variant="outline"
					className="w-full gap-2 border-primary/30 hover:bg-primary-muted"
					onClick={handleGitHub}
					disabled={isLoading}
				>
					<Github className="h-4 w-4" />
					Continue with GitHub
				</Button>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
					</div>
				</div>

				<form onSubmit={handleMagicLink} className="space-y-4">
					<Input
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={isLoading}
					/>
					<Button
						type="submit"
						className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
						disabled={isLoading || !email.trim()}
					>
						<Mail className="h-4 w-4" />
						{isLoading ? 'Sending...' : 'Send Magic Link'}
					</Button>
				</form>

				<p className="text-center text-sm text-muted-foreground">
					No account? One will be created automatically.
				</p>
			</CardContent>
		</Card>
	);
}

export default function LoginPage() {
	return (
		<main className="min-h-screen flex items-center justify-center p-4">
			<div className="space-y-6 w-full max-w-md">
				<Suspense
					fallback={
						<Card className="w-full max-w-md">
							<CardContent className="py-12 text-center">Loading...</CardContent>
						</Card>
					}
				>
					<LoginForm />
				</Suspense>
				<div className="text-center">
					<Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
						Back to home
					</Link>
				</div>
			</div>
		</main>
	);
}
