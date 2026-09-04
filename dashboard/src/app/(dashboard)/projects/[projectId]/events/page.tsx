import { notFound } from 'next/navigation';

import { EVENTS_PAGE_SIZE, EventsFeed, recentEvents } from '@/modules/events';
import { findProject } from '@/modules/projects';

export const dynamic = 'force-dynamic';

export default async function EventsPage({
  params,
}: PageProps<'/projects/[projectId]/events'>) {
  const { projectId } = await params;

  // Both reads are independent, and the feed's first page is the slower one —
  // no reason to make the reader wait for them in sequence.
  const [project, initialPage] = await Promise.all([
    findProject(projectId),
    recentEvents({ projectId, limit: EVENTS_PAGE_SIZE }),
  ]);

  if (project === null) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Events</h1>
        <p className="text-sm text-muted-foreground">
          Newest first, for {project.name}.
        </p>
      </div>
      <EventsFeed projectId={projectId} initialPage={initialPage} />
    </div>
  );
}
