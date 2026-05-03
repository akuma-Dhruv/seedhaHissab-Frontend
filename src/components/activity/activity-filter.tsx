import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ACTIVITY_TYPE_GROUPS,
  type ActivityType,
  type ActivityVisibilityScope,
} from '@/lib/activity-types';

interface Props {
  scope: ActivityVisibilityScope | 'ALL';
  onScopeChange: (scope: ActivityVisibilityScope | 'ALL') => void;
  type: ActivityType | 'ALL';
  onTypeChange: (type: ActivityType | 'ALL') => void;
  showPrivateFilter?: boolean;
}

/**
 * Presentation-only filters. The backend remains the authoritative gate
 * for visibility — the FE filter can only narrow what the server already
 * decided to return.
 */
export function ActivityFilter({
  scope,
  onScopeChange,
  type,
  onTypeChange,
  showPrivateFilter = true,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showPrivateFilter && (
        <div className="flex rounded-md border bg-card p-0.5">
          {(['ALL', 'OFFICIAL', 'PRIVATE'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={scope === s ? 'default' : 'ghost'}
              className="h-7 px-3 text-xs"
              onClick={() => onScopeChange(s)}
              data-testid={`activity-scope-${s.toLowerCase()}`}
            >
              {s === 'ALL' ? 'All' : s === 'OFFICIAL' ? 'Official' : 'Private'}
            </Button>
          ))}
        </div>
      )}

      <Select
        value={type}
        onValueChange={(v) => onTypeChange(v as ActivityType | 'ALL')}
      >
        <SelectTrigger className="h-9 w-[200px]" data-testid="activity-type-filter">
          <SelectValue placeholder="All event types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All event types</SelectItem>
          {Object.entries(ACTIVITY_TYPE_GROUPS).flatMap(([group, types]) =>
            types.map((t) => (
              <SelectItem key={t} value={t}>
                {group} · {t.replace(/_/g, ' ').toLowerCase()}
              </SelectItem>
            )),
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
