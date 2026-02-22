'use client';

import { Check, Share2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { trackGuideShared } from '@/lib/analytics';

interface ShareButtonProps {
	slug: string;
	guideId?: string;
	specUrl?: string | null;
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'default' | 'sm' | 'lg' | 'icon';
	showIcon?: boolean;
}

export function ShareButton({
	slug,
	guideId,
	specUrl,
	variant = 'outline',
	size = 'default',
	showIcon = true,
}: ShareButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleShare = useCallback(async () => {
		const shareUrl = `${window.location.origin}/g/${slug}`;

		try {
			if (navigator.share) {
				await navigator.share({
					title: 'Quick Start Guide - Runway',
					text: 'Check out this API Quick Start guide',
					url: shareUrl,
				});
			} else {
				await navigator.clipboard.writeText(shareUrl);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			}

			if (guideId) {
				trackGuideShared(guideId, specUrl);
			}
		} catch (error) {
			if ((error as Error).name !== 'AbortError') {
				console.error('Share failed:', error);
			}
		}
	}, [slug, guideId, specUrl]);

	return (
		<Button variant={variant} size={size} onClick={handleShare} className="gap-2">
			{showIcon &&
				(copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />)}
			{copied ? 'Copied!' : 'Share'}
		</Button>
	);
}
