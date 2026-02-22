import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/auth';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Runway - Time to First API Call',
	description:
		'From OpenAPI spec to your first API call in seconds. Generate quick start guides with copy-paste code snippets.',
	keywords: ['OpenAPI', 'Swagger', 'API', 'Developer Tools', 'Quick Start'],
	authors: [{ name: 'Runway' }],
	openGraph: {
		title: 'Runway - Time to First API Call',
		description: 'From OpenAPI spec to your first API call in seconds.',
		type: 'website',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
			>
				<AuthProvider>
					<SiteHeader />
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}
