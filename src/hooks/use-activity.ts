import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type {
  ActivityFeedResponse,
  ActivityType,
  ActivityVisibilityScope,
} from '@/lib/activity-types';

/**
 * Activity timeline hooks.
 *
 * Visibility is server-enforced — these hooks just pass the optional
 * presentation filter through. The default (no scope param) returns
 * OFFICIAL plus the caller's own PRIVATE rows merged chronologically.
 */
interface ActivityParams {
  page?: number;
  limit?: number;
  type?: ActivityType;
  visibilityScope?: ActivityVisibilityScope;
}

function paramsObject(p: ActivityParams): Record<string, unknown> {
  const out: Record<string, unknown> = {
    page: p.page ?? 0,
    limit: p.limit ?? 30,
  };
  if (p.type) out.type = p.type;
  if (p.visibilityScope) out.visibilityScope = p.visibilityScope;
  return out;
}

export function useProjectActivity(projectId: string | undefined, params: ActivityParams = {}) {
  return useQuery({
    queryKey: ['project-activity', projectId, params],
    queryFn: () =>
      apiGet<ActivityFeedResponse>(`/projects/${projectId}/activity`, paramsObject(params)),
    enabled: !!projectId,
  });
}

export function usePersonalActivity(params: ActivityParams = {}) {
  return useQuery({
    queryKey: ['personal-activity', params],
    queryFn: () => apiGet<ActivityFeedResponse>('/personal/activity', paramsObject(params)),
  });
}

export function useCounterpartyActivity(name: string | undefined, params: ActivityParams = {}) {
  return useQuery({
    queryKey: ['counterparty-activity', name, params],
    queryFn: () =>
      apiGet<ActivityFeedResponse>(
        `/personal/counterparties/${encodeURIComponent(name ?? '')}/activity`,
        paramsObject(params),
      ),
    enabled: !!name,
  });
}
