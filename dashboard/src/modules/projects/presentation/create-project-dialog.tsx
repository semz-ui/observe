'use client';

import { TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useState } from 'react';

import { createProjectAction } from '../application/create-project.action';
import { INITIAL_CREATE_STATE } from '../application/create-project-state';
import { CopyButton } from './copy-button';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

export function CreateProjectDialog(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    INITIAL_CREATE_STATE,
  );
  const router = useRouter();

  const project = state.status === 'created' ? state.project : undefined;
  // Once the key is on screen, closing this dialog destroys it. Every ordinary
  // way out of a modal is therefore disabled until the reader says they have it.
  const revealed = project !== undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (revealed && !next) return;
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">New project</Button>
      </DialogTrigger>

      <DialogContent
        // `sm:max-w-2xl` rather than `max-w-xl`: the primitive sets
        // `sm:max-w-sm`, and tailwind-merge only replaces a class of the same
        // variant — an unprefixed max-width loses to it above the sm breakpoint,
        // leaving the panel narrow while this content overflows it.
        className="sm:max-w-2xl"
        showCloseButton={!revealed}
        onEscapeKeyDown={(event) => {
          if (revealed) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (revealed) event.preventDefault();
        }}
      >
        {revealed ? (
          <>
            <DialogHeader>
              <DialogTitle>{project.name} is ready</DialogTitle>
              <DialogDescription>
                Copy the key now. This is the only time it is ever shown.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-muted-foreground">
                observe stores a SHA-256 digest of this key, never the key
                itself. If you lose it, nobody can recover it — not an admin,
                not the database owner. You would have to create another
                project.
              </p>
            </div>

            {/* min-w-0: a grid child defaults to min-content width, so the
                unbreakable snippet below would widen the whole panel instead of
                scrolling inside it. */}
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-xs font-medium">API key</span>
              <code className="rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm break-all">
                {project.apiKey}
              </code>
              <div>
                <CopyButton value={project.apiKey} label="Copy key" />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-xs font-medium">Install snippet</span>
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs">
                {state.installSnippet}
              </pre>
              <div>
                <CopyButton
                  value={state.installSnippet ?? ''}
                  label="Copy snippet"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false);
                  // Straight to the feed: its empty state says to install the
                  // SDK and click something, which is exactly the next step.
                  router.push(`/projects/${project.id}/events`);
                }}
              >
                I&apos;ve copied it
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>
                Each project gets its own API key. The key is shown once, right
                after this.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 py-4">
              <Input
                name="name"
                placeholder="Marketing site"
                maxLength={100}
                autoComplete="off"
                required
                aria-invalid={state.status === 'error'}
              />
              {state.status === 'error' ? (
                <p className="text-sm text-destructive">{state.message}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create project'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
