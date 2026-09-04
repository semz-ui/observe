import { Skeleton } from '@/shared/ui/skeleton';

export function EventsTableSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: 8 }, (_, row) => (
        <Skeleton key={row} className="h-8 w-full" />
      ))}
    </div>
  );
}
