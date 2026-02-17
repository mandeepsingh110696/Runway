'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
	code: string;
	language: string;
	title?: string;
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	return (
		<div className="relative group rounded-lg border bg-muted/50 overflow-hidden">
			{title && (
				<div className="px-4 py-2 border-b bg-muted/80 flex items-center justify-between">
					<span className="text-sm font-medium text-muted-foreground">{title}</span>
					<span className="text-xs text-muted-foreground uppercase">{language}</span>
				</div>
			)}
			<div className="relative">
				<pre className="p-4 overflow-x-auto text-sm">
					<code className={`language-${language}`}>{code}</code>
				</pre>
				<Button
					variant="ghost"
					size="icon"
					className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={handleCopy}
				>
					{copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
					<span className="sr-only">Copy code</span>
				</Button>
			</div>
		</div>
	);
}
