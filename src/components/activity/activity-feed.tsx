import { useMemo } from 'react';
import { ActivityCard } from './activity-card';
import { TimelineDateDivider } from './timeline-date-divider';
import type { ActivityItem } from '@/lib/activity-types';

interface Props {
  items: ActivityItem[];
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Flat ordered stream from the backend, grouped on the FE by calendar
 * day for legibility. Grouping is purely presentation; the underlying
 * order from the server is preserved within each day.
 */
export function ActivityFeed({ items, loading, emptyMessage }: Props) {
  const groups = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(addDays(new Date(), -1));

    const buckets = new Map<string, ActivityItem[]>();
    for (const item of items) {
      const d = startOfDay(new Date(item.timestamp));
      let label: string;
      if (sameDay(d, today)) label = 'Today';
      else if (sameDay(d, yesterday)) label = 'Yesterday';
      else label = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      const existing = buckets.get(label) ?? [];
      existing.push(item);
      buckets.set(label, existing);
    }
    return Array.from(buckets.entries());
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-2" data-testid="activity-feed-loading">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center" data-testid="activity-feed-empty">
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? 'Nothing has happened here yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="activity-feed">
      {groups.map(([label, group]) => (
        <div key={label} className="space-y-2">
          <TimelineDateDivider label={label} />
          {group.map((item) => (
            <ActivityCard key={item.activityKey} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}

function startOfDay(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
