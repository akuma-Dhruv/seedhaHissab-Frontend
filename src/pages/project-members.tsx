import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Shield, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { getCurrentUserId } from '@/lib/auth';
import {
  useArchiveMember,
  useInviteMember,
  useProjectMembers,
  useRestoreMember,
  useUpdateMemberRole,
} from '@/hooks/use-project-members';
import type { Project, ProjectMember, ProjectMemberRole } from '@/lib/types';

const ROLE_LABEL: Record<ProjectMemberRole, string> = {
  OWNER: 'Project owner',
  EDITOR: 'Can edit transactions',
  ACCOUNTANT: 'Can record transactions only',
  VIEWER: 'View only',
};

const ROLE_HINT: Record<ProjectMemberRole, string> = {
  OWNER: 'Full access. Manages members, edits, and deletes.',
  EDITOR: 'Can record and edit transactions.',
  ACCOUNTANT: 'Can record transactions but cannot edit existing ones.',
  VIEWER: 'Read-only access to the project.',
};

const ROLE_COLOR: Record<ProjectMemberRole, string> = {
  OWNER: 'bg-purple-100 text-purple-900 hover:bg-purple-100',
  EDITOR: 'bg-blue-100 text-blue-900 hover:bg-blue-100',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100',
  VIEWER: 'bg-slate-100 text-slate-900 hover:bg-slate-100',
};

const ALL_ROLES: ProjectMemberRole[] = ['OWNER', 'EDITOR', 'ACCOUNTANT', 'VIEWER'];

export default function ProjectMembersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();

  const [includeArchived, setIncludeArchived] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>('VIEWER');
  const [memberToArchive, setMemberToArchive] = useState<ProjectMember | null>(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiGet<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
  const { data: members, isLoading } = useProjectMembers(projectId, includeArchived);

  const inviteMutation = useInviteMember(projectId);
  const updateRoleMutation = useUpdateMemberRole(projectId);
  const archiveMutation = useArchiveMember(projectId);
  const restoreMutation = useRestoreMember(projectId);

  const myMembership = members?.find((m) => m.userId === currentUserId && !m.archivedAt);
  const canManage = myMembership?.role === 'OWNER';

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail('');
          setInviteRole('VIEWER');
        },
      },
    );
  };

  const handleRoleChange = (member: ProjectMember, newRole: ProjectMemberRole) => {
    if (member.role === newRole) return;
    updateRoleMutation.mutate({ memberId: member.id, req: { role: newRole } });
  };

  const handleArchive = () => {
    if (!memberToArchive) return;
    archiveMutation.mutate(memberToArchive.id, {
      onSuccess: () => setMemberToArchive(null),
    });
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/projects/${projectId}`)}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight truncate">Members</h1>
              {project?.name && (
                <p className="text-sm text-muted-foreground truncate">{project.name}</p>
              )}
            </div>
            {canManage && (
              <Button onClick={() => setInviteOpen(true)} data-testid="button-invite-member">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite member
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Show archived members</p>
                <p className="text-xs text-muted-foreground">
                  Removed members stay in history for activity attribution.
                </p>
              </div>
              <Switch
                checked={includeArchived}
                onCheckedChange={setIncludeArchived}
                data-testid="switch-include-archived"
              />
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(members ?? []).map((m) => {
                const isSelf = m.userId === currentUserId;
                const isArchived = !!m.archivedAt;
                return (
                  <Card
                    key={m.id}
                    className={isArchived ? 'opacity-60' : ''}
                    data-testid={`member-row-${m.id}`}
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">
                            {m.userName ?? m.userEmail ?? 'Unknown user'}
                            {isSelf && (
                              <span className="text-xs text-muted-foreground ml-2">(you)</span>
                            )}
                          </p>
                          {isArchived && <Badge variant="outline">Removed</Badge>}
                        </div>
                        {m.userEmail && (
                          <p className="text-xs text-muted-foreground truncate">{m.userEmail}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {canManage && !isArchived ? (
                          <Select
                            value={m.role}
                            onValueChange={(v) =>
                              handleRoleChange(m, v as ProjectMemberRole)
                            }
                          >
                            <SelectTrigger
                              className="w-[200px]"
                              data-testid={`select-role-${m.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  <div className="flex flex-col">
                                    <span>{ROLE_LABEL[r]}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {ROLE_HINT[r]}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={ROLE_COLOR[m.role]} variant="secondary">
                            <Shield className="w-3 h-3 mr-1" />
                            {ROLE_LABEL[m.role]}
                          </Badge>
                        )}

                        {canManage && !isArchived && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMemberToArchive(m)}
                            data-testid={`button-archive-${m.id}`}
                            aria-label="Remove member"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        {canManage && isArchived && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreMutation.mutate(m.id)}
                            data-testid={`button-restore-${m.id}`}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {members && members.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">
                    No members yet.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!canManage && myMembership && (
            <p className="text-xs text-muted-foreground text-center">
              Only the project owner can invite or remove members.
            </p>
          )}
        </div>

        {/* Invite dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="someone@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-invite-email"
                />
                <p className="text-xs text-muted-foreground">
                  The person must already have a SeedhaHisaab account.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as ProjectMemberRole)}
                >
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        <div className="flex flex-col">
                          <span>{ROLE_LABEL[r]}</span>
                          <span className="text-xs text-muted-foreground">{ROLE_HINT[r]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
                data-testid="button-confirm-invite"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Send invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive confirmation */}
        <AlertDialog
          open={!!memberToArchive}
          onOpenChange={(open) => !open && setMemberToArchive(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this member?</AlertDialogTitle>
              <AlertDialogDescription>
                {memberToArchive?.userName ?? memberToArchive?.userEmail} will lose access
                immediately. Their past activity stays visible in the timeline. You can restore
                them later by inviting them again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchive}
                data-testid="button-confirm-archive"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </AuthGuard>
  );
}
