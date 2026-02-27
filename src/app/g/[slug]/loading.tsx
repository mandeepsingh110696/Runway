import { Skeleton } from '@/components/ui/skeleton';

export default function SharedGuideLoading() {
	return (
		<div className="w-full max-w-4xl mx-auto space-y-6 py-8 px-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-10 w-24" />
				<Skeleton className="h-9 w-32" />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-8 w-3/4" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-6 w-24" />
				<Skeleton className="h-32 w-full rounded-lg" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-6 w-20" />
				<Skeleton className="h-24 w-full rounded-lg" />
			</div>
		</div>
	);
}
