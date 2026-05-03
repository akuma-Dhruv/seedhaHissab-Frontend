import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { ActivityFilter } from '@/components/activity/activity-filter';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { useProjectActivity } from '@/hooks/use-activity';
import type { ActivityType, ActivityVisibilityScope, ActivityItem } from '@/lib/activity-types';

interface ProjectLite {
  id: string;
  name: string;
}

const PAGE_LIMIT = 30;

export default function ProjectActivityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [scope, setScope] = useState<ActivityVisibilityScope | 'ALL'>('ALL');
  const [type, setType] = useState<ActivityType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [accumulated, setAccumulated] = useState<ActivityItem[]>([]);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiGet<ProjectLite>(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  const { data, isFetching } = useProjectActivity(projectId, {
    page,
    limit: PAGE_LIMIT,
    type: type === 'ALL' ? undefined : type,
    visibilityScope: scope === 'ALL' ? undefined : scope,
  });

  // Reset accumulator whenever filter changes (page resets to 0).
  const filterKey = `${scope}|${type}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPage(0);
    setAccumulated([]);
  }

  // Append new pages as they arrive (dedupe on activityKey — Q: why? because
  // boundaries between pages can shift when new events arrive between fetches).
  if (data && data.page === page) {
    const seen = new Set(accumulated.map((i) => i.activityKey));
    const newOnes = data.items.filter((i) => !seen.has(i.activityKey));
    if (newOnes.length > 0) {
      setAccumulated((prev) => (page === 0 ? data.items : [...prev, ...newOnes]));
    } else if (page === 0 && accumulated.length === 0 && data.items.length > 0) {
      setAccumulated(data.items);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/projects/${projectId}`)}
          data-testid="back-to-project"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Activity</h1>
          {project && (
            <p className="text-sm text-muted-foreground">{project.name}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">What happened</CardTitle>
            <ActivityFilter
              scope={scope}
              onScopeChange={(s) => {
                setScope(s);
                setPage(0);
              }}
              type={type}
              onTypeChange={(t) => {
                setType(t);
                setPage(0);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            items={accumulated}
            loading={isFetching && accumulated.length === 0}
            emptyMessage="No activity yet for this project."
          />
          {data?.hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching}
                data-testid="activity-load-more"
              >
                <ChevronDown className="mr-1 h-4 w-4" />
                {isFetching ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
