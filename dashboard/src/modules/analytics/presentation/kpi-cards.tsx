import { compactNumber, signedPercent } from './format';
import { percentChange } from '../application/date-range';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export interface Kpi {
  readonly label: string;
  readonly value: number;
  readonly previous: number;
}

/**
 * Stat tiles, not a one-bar bar chart: three headline numbers whose job is to be
 * read, not compared visually.
 */
export function KpiCards({
  kpis,
  previousLabel,
}: {
  kpis: readonly Kpi[];
  previousLabel: string;
}): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {kpis.map(({ label, value, previous }) => {
        const change = percentChange(value, previous);

        return (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {/*
                Proportional figures deliberately: tabular-nums gives every digit
                the width of a zero, which makes a short number look loose at
                display size. Tabular belongs in the columns below.
              */}
              <span className="text-3xl font-semibold tracking-tight">
                {compactNumber(value)}
              </span>
              <span className="text-xs text-muted-foreground">
                {change === null ? (
                  // Growth from zero is undefined, not +100%.
                  <>no {previousLabel} to compare</>
                ) : (
                  <>
                    <span
                      className={
                        change >= 0 ? 'text-foreground' : 'text-destructive'
                      }
                    >
                      {change >= 0 ? '↑' : '↓'} {signedPercent(change)}
                    </span>{' '}
                    vs {previousLabel}
                  </>
                )}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
