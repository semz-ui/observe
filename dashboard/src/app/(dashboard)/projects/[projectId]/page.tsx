import Link from 'next/link';
import { notFound } from 'next/navigation';

import { findProject } from '@/modules/projects';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export const dynamic = 'force-dynamic';

// What this segment is for: everything below it is scoped to one project. M3
// hangs /events off it and M4 turns this page into the overview.
export default async function ProjectPage({
  params,
}: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await params;
  const project = await findProject(projectId);

  if (project === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
        <p className="font-mono text-xs text-muted-foreground">{project.id}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={`/projects/${project.id}/events`} className="rounded-xl">
          <Card className="h-full transition-colors hover:border-ring">
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                The live feed of captured clicks.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Totals, events over time, top elements and pages. Arrives in M4.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
