import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet } from '@/lib/api';
import { useCreateHiddenAgreement, useHiddenAgreements } from '@/hooks/use-hidden-partners';
import type { Partner } from '@/lib/types';

interface Props {
  projectId: string;
  onSuccess?: () => void;
  /** Pre-select an official partner. */
  defaultOfficialPartnerId?: string;
}

function fmtPct(n: number) {
  return Number(n).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

/**
 * Create-form for a hidden partner agreement.
 *
 * Surfaces the most-confused detail prominently: the percentage entered is a
 * percentage of the chosen official partner's slice, not of the project.
 * Live helper text shows the effective project ownership the moment the
 * user types so they cannot misread it as a project-level percentage.
 */
export function HiddenAgreementForm({ projectId, onSuccess, defaultOfficialPartnerId }: Props) {
  const { data: partners, isLoading: partnersLoading } = useQuery({
    queryKey: ['partners', projectId],
    queryFn: () => apiGet<Partner[]>(`/projects/${projectId}/partners`),
    enabled: !!projectId,
  });
  const { data: existing } = useHiddenAgreements(projectId);
  const create = useCreateHiddenAgreement(projectId);

  const [officialPartnerId, setOfficialPartnerId] = useState(defaultOfficialPartnerId || '');
  const [hiddenPartnerName, setHiddenPartnerName] = useState('');
  const [shareStr, setShareStr] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (defaultOfficialPartnerId) setOfficialPartnerId(defaultOfficialPartnerId);
  }, [defaultOfficialPartnerId]);

  const officialPartner = useMemo(
    () => partners?.find(p => p.id === officialPartnerId),
    [partners, officialPartnerId],
  );

  const alreadyPromised = useMemo(() => {
    if (!officialPartnerId || !existing) return 0;
    return existing
      .filter(a => !a.archived && a.officialPartnerId === officialPartnerId)
      .reduce((s, a) => s + Number(a.sharePercentage), 0);
  }, [existing, officialPartnerId]);

  const remainingCap = Math.max(0, 100 - alreadyPromised);

  const shareNum = Number(shareStr);
  const shareValid = shareStr !== '' && !Number.isNaN(shareNum) && shareNum > 0 && shareNum <= remainingCap;

  const effectivePct = officialPartner && shareValid
    ? (Number(officialPartner.sharePercentage) * shareNum) / 100
    : null;

  const canSubmit =
    !create.isPending
    && !!officialPartnerId
    && !!hiddenPartnerName.trim()
    && shareValid;

  const handleSubmit = () => {
    create.mutate({
      officialPartnerId,
      hiddenPartnerName: hiddenPartnerName.trim(),
      sharePercentage: shareNum,
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        setHiddenPartnerName('');
        setShareStr('');
        setNotes('');
        onSuccess?.();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Whose share are you splitting?</Label>
        <Select value={officialPartnerId} onValueChange={setOfficialPartnerId}>
          <SelectTrigger data-testid="select-official-partner">
            <SelectValue placeholder={partnersLoading ? 'Loading…' : 'Choose an official partner'} />
          </SelectTrigger>
          <SelectContent>
            {(partners || []).map(p => (
              <SelectItem key={p.id} value={p.id} data-testid={`option-partner-${p.id}`}>
                {p.name} — {fmtPct(Number(p.sharePercentage))}% of project
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {officialPartner && (
          <p className="text-xs text-muted-foreground">
            You're redistributing part of <strong>{officialPartner.name}</strong>'s
            {' '}{fmtPct(Number(officialPartner.sharePercentage))}% slice.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Private partner name</Label>
        <Input
          data-testid="input-hidden-name"
          value={hiddenPartnerName}
          onChange={e => setHiddenPartnerName(e.target.value)}
          placeholder="e.g. Mama-ji, Silent Investor, Family Trust"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Their share of {officialPartner?.name || "this partner"}'s slice (%)</Label>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0.01}
          max={remainingCap}
          data-testid="input-hidden-share"
          value={shareStr}
          onChange={e => setShareStr(e.target.value)}
          placeholder={`Up to ${fmtPct(remainingCap)}`}
        />
        <div className="space-y-0.5 text-xs">
          {officialPartner ? (
            <>
              <p className="text-muted-foreground">
                Already privately promised on {officialPartner.name}:
                {' '}<strong>{fmtPct(alreadyPromised)}%</strong> of their slice.
                {' '}Remaining: <strong>{fmtPct(remainingCap)}%</strong>.
              </p>
              {effectivePct !== null && (
                <p className="text-emerald-700 dark:text-emerald-400" data-testid="text-effective-share">
                  Effective project share for this person:
                  {' '}<strong>{fmtPct(effectivePct)}%</strong> of total project
                  {' '}({fmtPct(Number(officialPartner.sharePercentage))}% × {fmtPct(shareNum)}% ÷ 100).
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              Pick an official partner first. The percentage you enter is a
              share of <em>their</em> slice — not of the whole project.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          data-testid="input-hidden-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anything you want to remember about this private agreement."
          rows={3}
          maxLength={2048}
        />
      </div>

      <Button
        className="w-full"
        data-testid="button-save-hidden-agreement"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {create.isPending ? 'Saving…' : 'Save private agreement'}
      </Button>
    </div>
  );
}
