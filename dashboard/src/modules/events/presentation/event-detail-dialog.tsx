'use client';

import type { ClickEvent } from '../domain/event';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

/** Every field the API returns, including the ones no column has room for. */
const FIELDS: readonly (keyof ClickEvent)[] = [
  'id',
  'timestamp',
  'url',
  'pageTitle',
  'elementTag',
  'elementId',
  'elementText',
  'elementSelector',
  'elementHref',
  'anonymousId',
  'sessionId',
  'projectId',
];

export function EventDetailDialog({
  event,
  onClose,
}: {
  event: ClickEvent | null;
  onClose: () => void;
}): React.ReactElement {
  return (
    <Dialog
      open={event !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Event</DialogTitle>
          <DialogDescription>
            Every field the feed endpoint returns. Absent fields were never
            captured — the API omits them rather than sending null.
          </DialogDescription>
        </DialogHeader>
        {event === null ? null : (
          <dl className="grid grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
            {FIELDS.map((field) => (
              <div key={field} className="contents">
                <dt className="text-muted-foreground">{field}</dt>
                <dd className="font-mono text-xs break-all">
                  {event[field] ?? (
                    <span className="text-muted-foreground italic">absent</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
