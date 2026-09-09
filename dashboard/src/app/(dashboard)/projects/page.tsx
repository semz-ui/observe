import {
  CreateProjectDialog,
  ProjectsEmptyState,
  ProjectsList,
  listProjects,
} from '@/modules/projects';

// Projects change only when someone creates one, and the create action
// revalidates this path — but a stale list is confusing enough that this stays
// live rather than relying on that alone.
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
        {projects.length === 0 ? null : <CreateProjectDialog />}
      </div>
      {projects.length === 0 ? (
        <ProjectsEmptyState />
      ) : (
        <ProjectsList projects={projects} />
      )}
    </div>
  );
}
