import {
  ProjectsEmptyState,
  ProjectsList,
  listProjects,
} from '@/modules/projects';

// Projects change only when someone creates one, but a stale list is confusing
// the moment M5 can create them, so this stays live.
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
      {projects.length === 0 ? (
        <ProjectsEmptyState />
      ) : (
        <ProjectsList projects={projects} />
      )}
    </div>
  );
}
