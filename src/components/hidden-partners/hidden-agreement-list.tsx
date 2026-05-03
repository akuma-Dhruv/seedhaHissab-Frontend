import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useArchiveHiddenAgreement,
  useHiddenAgreements,
  useRestoreHiddenAgreement,
  useUpdateHiddenAgreement,
} from '@/hooks/use-hidden-partners';
import type { HiddenPartnerAgreement } from '@/lib/types';

function fmtPct(n: number) {
  return Number(n).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

interface Props {
  projectId: string;
  includeArchived: boolean;
}

/**
 * Lists every active (and optionally archived) hidden agreement on a project.
 * Each row supports editing share %/notes and archiving / restoring. We never
 * expose hard-delete: the agreement row is the only audit trail of who got
 * what privately.
 */
export function HiddenAgreementList({ projectId, includeArchived }: Props) {
  const { data, isLoading } = useHiddenAgreements(projectId, includeArchived);
  const update = useUpdateHiddenAgreement(projectId);
  const archive = useArchiveHiddenAgreement(projectId);
  const restore = useRestoreHiddenAgreement(projectId);

  const [editing, setEditing] = useState<HiddenPartnerAgreement | null>(null);
  const [editShare, setEditShare] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<HiddenPartnerAgreement | null>(null);

  const openEdit = (a: HiddenPartnerAgreement) => {
    setEditing(a);
    setEditShare(String(a.sharePercentage));
    setEditNotes(a.notes || '');
  };

  if (isLoading) {
    return <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-20" />)}</div>;
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No private partners yet. Add one above to start tracking your internal share distribution.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {data.map(a => (
          <Card
            key={a.id}
            className={a.archived ? 'opacity-60' : undefined}
            data-testid={`card-hidden-agreement-${a.id}`}
          >
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{a.hiddenPartnerName}</span>
                    {a.archived && <Badge variant="outline">Archived</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Out of <strong>{a.officialPartnerName}</strong>'s slice
                  </p>
                  {a.notes && (
                    <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap break-words">
                      {a.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" data-testid={`badge-share-${a.id}`}>
                    {fmtPct(Number(a.sharePercentage))}% of slice
                  </Badge>
                  {!a.archived && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-edit-${a.id}`}
                        onClick={() => openEdit(a)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-archive-${a.id}`}
                        onClick={() => setArchiveTarget(a)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {a.archived && (
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-restore-${a.id}`}
                      onClick={() => restore.mutate(a.id)}
                      disabled={restore.isPending}
                    >
                      <ArchiveRestore className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit private agreement</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 mt-1">
              <p className="text-xs text-muted-foreground">
                <strong>{editing.hiddenPartnerName}</strong> — out of{' '}
                <strong>{editing.officialPartnerName}</strong>'s slice.
                Name and the official-partner pairing are fixed for audit clarity.
              </p>
              <div className="space-y-1.5">
                <Label>Share % of {editing.officialPartnerName}'s slice</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={100}
                  data-testid="input-edit-share"
                  value={editShare}
                  onChange={e => setEditShare(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  data-testid="input-edit-notes"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={3}
                  maxLength={2048}
                />
              </div>
              <Button
                className="w-full"
                data-testid="button-save-edit"
                disabled={update.isPending}
                onClick={() => {
                  const sharePercentage = Number(editShare);
                  update.mutate({
                    id: editing.id,
                    req: {
                      sharePercentage: Number.isFinite(sharePercentage) ? sharePercentage : undefined,
                      notes: editNotes.trim() ? editNotes.trim() : '',
                    },
                  }, { onSuccess: () => setEditing(null) });
                }}
              >
                {update.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={open => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this private agreement?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget && (
                <>
                  <strong>{archiveTarget.hiddenPartnerName}</strong>'s slice will stop
                  appearing in active calculations, but the agreement itself is kept
                  as history. You can restore it later.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-archive"
              onClick={() => {
                if (archiveTarget) {
                  archive.mutate(archiveTarget.id, {
                    onSuccess: () => setArchiveTarget(null),
                  });
                }
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
