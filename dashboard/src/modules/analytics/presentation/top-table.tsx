import { TOP_N } from '../domain/stats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export interface TopRow {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

/**
 * A table rather than a bar chart: ten labelled classes that all carry meaning,
 * where the label — a CSS selector or a URL — is the thing being read.
 *
 * Titled "Top 10" because that is not a choice: `topLimit` exists on the server's
 * use case but not on its DTO, and `whitelist: true` strips unknown query params,
 * so a page-size control here would silently do nothing at all.
 */
export function TopTable({
  title,
  columnLabel,
  rows,
}: {
  title: string;
  columnLabel: string;
  rows: readonly TopRow[];
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">
        {title}{' '}
        <span className="font-normal text-muted-foreground">(top {TOP_N})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing captured in this range.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{columnLabel}</TableHead>
              <TableHead className="w-24 text-right">Events</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell
                  className="max-w-0 truncate font-mono text-xs"
                  title={row.label}
                >
                  {row.label}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.count.toLocaleString('en-US')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
