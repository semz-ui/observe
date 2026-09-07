'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DailyCount } from '../domain/stats';
import { shortDayUtc } from './format';

const SERIES = 'var(--chart-series-1)';
const SURFACE = 'var(--card)';

interface TooltipPayload {
  readonly active?: boolean;
  readonly payload?: readonly { readonly payload?: DailyCount }[];
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  const entry = payload?.[0]?.payload;
  if (active !== true || entry === undefined) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <div className="text-muted-foreground">{entry.day} (UTC)</div>
      <div className="font-medium tabular-nums">
        {entry.count.toLocaleString('en-US')} events
      </div>
    </div>
  );
}

/**
 * One series, so no legend: the heading already says what is plotted, and a box
 * with a single swatch just restates it.
 *
 * The peak day is the only point given a marker and a label. Labelling every
 * point is noise that goes unread; the axis and the tooltip carry the rest.
 */
function PeakDot({
  cx,
  cy,
  index,
  peakIndex,
  // Deliberately not called `value`: Recharts clones a custom dot with its own
  // props, and for an Area that `value` is the [base, value] pair — so a prop
  // of that name is silently replaced by [0, 62] and renders as "0,62".
  peakCount,
}: {
  cx?: number;
  cy?: number;
  index?: number;
  peakIndex: number;
  peakCount: number;
}) {
  if (index !== peakIndex || cx === undefined || cy === undefined) return null;

  return (
    <g>
      {/* 2px ring in the surface colour, so the marker stays legible where it
          crosses the line rather than being outlined in ink. */}
      <circle
        r={6}
        cx={cx}
        cy={cy}
        fill={SERIES}
        stroke={SURFACE}
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy - 12}
        textAnchor="middle"
        className="fill-foreground text-[11px] font-medium"
      >
        {peakCount.toLocaleString('en-US')}
      </text>
    </g>
  );
}

export function EventsOverTimeChart({
  days,
}: {
  days: readonly DailyCount[];
}): React.ReactElement {
  const peak = days.reduce(
    (best, entry, index) =>
      entry.count > best.count ? { index, count: entry.count } : best,
    { index: -1, count: -1 },
  );
  const isFlat = days.every((entry) => entry.count === 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={[...days]}
            margin={{ top: 20, right: 12, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <XAxis
              dataKey="day"
              tickFormatter={shortDayUtc}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              className="text-[11px]"
              stroke="var(--muted-foreground)"
            />
            <YAxis
              allowDecimals={false}
              width={44}
              tickLine={false}
              axisLine={false}
              className="text-[11px] tabular-nums"
              stroke="var(--muted-foreground)"
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            />
            <Area
              // Linear, not a smoothed curve: these are discrete UTC-day
              // buckets, and a spline draws values between them that the data
              // does not have.
              type="linear"
              dataKey="count"
              stroke={SERIES}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={SERIES}
              // A wash, never a saturated block — the line carries the shape.
              fillOpacity={0.1}
              activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
              dot={
                isFlat ? (
                  false
                ) : (
                  <PeakDot peakIndex={peak.index} peakCount={peak.count} />
                )
              }
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* The same numbers without the picture: a chart is not the only way in. */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">
          View as a table
        </summary>
        <table className="mt-2 w-full max-w-sm">
          <thead>
            <tr className="text-left">
              <th className="font-normal">Day (UTC)</th>
              <th className="font-normal">Events</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {days.map((entry) => (
              <tr key={entry.day}>
                <td>{entry.day}</td>
                <td>{entry.count.toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
