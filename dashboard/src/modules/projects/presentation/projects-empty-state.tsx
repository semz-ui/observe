import { CreateProjectDialog } from './create-project-dialog';

export function ProjectsEmptyState(): React.ReactElement {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm font-medium">No projects yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        A project is a site or app you are collecting clicks from. Creating one
        gives you an API key to install the SDK with.
      </p>
      <div className="mt-4 flex justify-center">
        <CreateProjectDialog />
      </div>
    </div>
  );
}
