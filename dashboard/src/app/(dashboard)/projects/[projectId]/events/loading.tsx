import { EventsTableSkeleton } from '@/modules/events';

// The page server-fetches the first page before it renders, so this is what
// covers that wait. Without it the whole shell would sit blank on a slow API.
export default function EventsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Events</h1>
      </div>
      <EventsTableSkeleton />
    </div>
  );
}
