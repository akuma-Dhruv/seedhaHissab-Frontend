import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActivityIcon } from './activity-icon';
import type { ActivityItem } from '@/lib/activity-types';

interface Props {
  item: ActivityItem;
}

/**
 * One row in the timeline. Renders title/subtitle as-is from the server —
 * we never compute or rephrase here. Lock icon is driven entirely by
 * `visibilityScope === 'PRIVATE'`.
 */
export function ActivityCard({ item }: Props) {
  const isPrivate = item.visibilityScope === 'PRIVATE';
  const isOmitted = item.badge === 'OMITTED';
  const time = new Date(item.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex gap-3 rounded-lg border p-3 ${
        isPrivate ? 'border-amber-200 bg-amber-50/40' : 'border-border bg-card'
      } ${isOmitted ? 'opacity-70' : ''}`}
      data-testid={`activity-card-${item.activityKey}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
        }`}
      >
        <ActivityIcon type={item.type} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`truncate text-sm font-medium ${isOmitted ? 'line-through' : ''}`}>
              {item.title}
            </p>
            {item.subtitle && (
              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isPrivate && (
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 bg-amber-100 text-amber-800"
              >
                <Lock className="h-3 w-3" /> Private
              </Badge>
            )}
            {item.badge === 'OMITTED' && (
              <Badge variant="outline" className="border-rose-300 text-rose-700">
                Omitted
              </Badge>
            )}
            {item.badge === 'CANCELLED' && (
              <Badge variant="outline" className="border-slate-300 text-slate-600">
                Cancelled
              </Badge>
            )}
            <span className="whitespace-nowrap text-xs text-muted-foreground">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
