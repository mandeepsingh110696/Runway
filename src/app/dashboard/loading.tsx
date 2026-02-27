import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
	return (
		<div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-9 w-48" />
					<Skeleton className="h-5 w-36" />
				</div>
				<Skeleton className="h-10 w-24" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-40 rounded-xl" />
				))}
			</div>
		</div>
	);
}
