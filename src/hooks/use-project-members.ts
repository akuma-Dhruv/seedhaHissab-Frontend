import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  ProjectMember,
  ProjectMemberInviteRequest,
  ProjectMemberRoleUpdateRequest,
} from '@/lib/types';

/**
 * Project membership hooks. Membership is the access gate — invalidating
 * `projects` after a change makes sure the listing reflects who can see
 * what immediately.
 */
function useInvalidate(projectId?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['project-members', projectId] });
    qc.invalidateQueries({ queryKey: ['projects'] });
  };
}

export function useProjectMembers(projectId?: string, includeArchived = false) {
  return useQuery({
    queryKey: ['project-members', projectId, includeArchived],
    queryFn: () =>
      apiGet<ProjectMember[]>(`/projects/${projectId}/members`, { includeArchived }),
    enabled: !!projectId,
  });
}

function errMsg(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback
  );
}

export function useInviteMember(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (req: ProjectMemberInviteRequest) =>
      apiPost<ProjectMember>(`/projects/${projectId}/members`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Member added' });
    },
    onError: (err) =>
      toast({
        title: 'Could not add member',
        description: errMsg(err, 'Please try again.'),
        variant: 'destructive',
      }),
  });
}

export function useUpdateMemberRole(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: ({ memberId, req }: { memberId: string; req: ProjectMemberRoleUpdateRequest }) =>
      apiPatch<ProjectMember>(`/projects/${projectId}/members/${memberId}/role`, req),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Role updated' });
    },
    onError: (err) =>
      toast({
        title: 'Could not update role',
        description: errMsg(err, 'Please try again.'),
        variant: 'destructive',
      }),
  });
}

export function useArchiveMember(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (memberId: string) =>
      apiPatch<ProjectMember>(`/projects/${projectId}/members/${memberId}/archive`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Member removed' });
    },
    onError: (err) =>
      toast({
        title: 'Could not remove member',
        description: errMsg(err, 'Please try again.'),
        variant: 'destructive',
      }),
  });
}

export function useRestoreMember(projectId?: string) {
  const { toast } = useToast();
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (memberId: string) =>
      apiPatch<ProjectMember>(`/projects/${projectId}/members/${memberId}/restore`),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Member restored' });
    },
    onError: (err) =>
      toast({
        title: 'Could not restore member',
        description: errMsg(err, 'Please try again.'),
        variant: 'destructive',
      }),
  });
}
