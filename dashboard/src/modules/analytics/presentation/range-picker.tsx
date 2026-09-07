'use client';

import { useRangePickerViewModel } from '../application/use-range-picker-view-model';
import { RANGE_OPTIONS, type RangeValue } from '../application/date-range';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { rangeLabel } from '../application/date-range';

export function RangePicker(): React.ReactElement {
  const range = useRangePickerViewModel();

  return (
    <Select
      value={range.value}
      onValueChange={(value) => {
        range.select(value as RangeValue);
      }}
    >
      <SelectTrigger size="sm" className="w-40">
        {/* Explicit children: Radix only knows its item labels once mounted, so
            a bare <SelectValue /> server-renders an empty trigger. */}
        <SelectValue>{rangeLabel(range.value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
