'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';

export function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        // Can reject — a non-secure context, or the user denying the
        // permission. Saying "copied" when nothing was copied is the one
        // failure this dialog cannot afford.
        navigator.clipboard.writeText(value).then(
          () => {
            setFailed(false);
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 2_000);
          },
          () => {
            setFailed(true);
          },
        );
      }}
    >
      {copied ? <Check /> : <Copy />}
      {failed ? 'Copy failed — select it by hand' : copied ? 'Copied' : label}
    </Button>
  );
}
