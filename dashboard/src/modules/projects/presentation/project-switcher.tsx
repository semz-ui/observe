'use client';

import { Check, ChevronsUpDown } from 'lucide-react';

import { useProjectSwitcherViewModel } from '../application/use-project-switcher-view-model';
import type { ProjectSummary } from '../domain/project';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function ProjectSwitcher({
  projects,
}: {
  projects: readonly ProjectSummary[];
}): React.ReactElement {
  const { current, label, isEmpty, select } =
    useProjectSwitcherViewModel(projects);

  if (isEmpty) {
    return (
      <Button variant="outline" disabled>
        No projects yet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-44 justify-between">
          {label}
          <ChevronsUpDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onSelect={() => {
              select(project.id);
            }}
          >
            {project.name}
            {project.id === current?.id ? <Check className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
