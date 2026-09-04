'use client';

import type { ClickEvent } from '../domain/event';
import { describeElement, pathOf, shortId, timeOfDayUtc } from './format';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export function EventsTable({
  rows,
  newIds,
  onInspect,
}: {
  rows: readonly ClickEvent[];
  newIds: ReadonlySet<string>;
  onInspect: (event: ClickEvent) => void;
}): React.ReactElement {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">When (UTC)</TableHead>
          <TableHead className="w-40">Element</TableHead>
          <TableHead>Text</TableHead>
          <TableHead className="w-56">Selector</TableHead>
          <TableHead className="w-48">Page</TableHead>
          <TableHead className="w-24">Visitor</TableHead>
          <TableHead className="w-16" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((event) => (
          <TableRow
            key={event.id}
            // The flash is the only signal that polling is alive on a quiet
            // feed. Keyed off ids that arrived on the last tick, so it runs
            // once per row rather than on every re-render.
            className={newIds.has(event.id) ? 'animate-flash' : undefined}
          >
            <TableCell className="font-mono text-xs">
              {timeOfDayUtc(event.timestamp)}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {describeElement(event)}
            </TableCell>
            <TableCell className="max-w-0 truncate">
              {event.elementText ?? (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="max-w-0 truncate font-mono text-xs text-muted-foreground">
              {event.elementSelector}
            </TableCell>
            <TableCell
              className="max-w-0 truncate font-mono text-xs text-muted-foreground"
              title={event.url}
            >
              {pathOf(event.url)}
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {shortId(event.anonymousId)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  onInspect(event);
                }}
              >
                Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
