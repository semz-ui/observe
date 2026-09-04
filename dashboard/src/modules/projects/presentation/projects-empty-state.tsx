export function ProjectsEmptyState(): React.ReactElement {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <p className="text-sm font-medium">No projects yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Creating one from here — with its API key shown once — arrives in M5.
        Until then a project comes from{' '}
        <code className="font-mono">POST /api/projects</code>.
      </p>
    </div>
  );
}
