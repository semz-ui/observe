import Link from 'next/link';

import type { ProjectSummary } from '../domain/project';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export function ProjectsList({
  projects,
}: {
  projects: readonly ProjectSummary[];
}): React.ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link
                href={`/projects/${project.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {/*
                Sliced rather than formatted with Intl: the API's timestamps are
                UTC, and a locale-formatted date rendered on the server would
                silently be the server's locale, not the reader's.
              */}
              <time dateTime={project.createdAt} className="font-mono text-xs">
                {project.createdAt.slice(0, 10)}
              </time>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
