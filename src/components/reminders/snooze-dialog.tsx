import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayInAppZone } from '@/lib/reminder-format';
import { useSnoozeReminder } from '@/hooks/use-reminders';
import type { Reminder } from '@/lib/types';

interface SnoozeDialogProps {
  reminder: Reminder | null;
  onClose: () => void;
}

/** Tiny "pick a new due date" dialog used by every snooze button. */
export function SnoozeDialog({ reminder, onClose }: SnoozeDialogProps) {
  const [newDueDate, setNewDueDate] = useState('');
  const snooze = useSnoozeReminder();

  useEffect(() => {
    if (reminder) {
      // default: tomorrow
      const t = todayInAppZone();
      const d = new Date(`${t}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      setNewDueDate(d.toISOString().slice(0, 10));
    }
  }, [reminder]);

  const submit = () => {
    if (!reminder || !newDueDate) return;
    snooze.mutate({ id: reminder.id, req: { newDueDate } }, { onSuccess: onClose });
  };

  return (
    <Dialog open={!!reminder} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm" data-testid="dialog-snooze">
        <DialogHeader>
          <DialogTitle>Snooze reminder</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          {reminder && (
            <p className="text-sm text-muted-foreground">
              {reminder.title}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="snooze-date">New due date</Label>
            <Input
              id="snooze-date"
              type="date"
              data-testid="input-snooze-date"
              value={newDueDate}
              min={todayInAppZone()}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" data-testid="button-snooze-cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button
            data-testid="button-snooze-confirm"
            disabled={!newDueDate || snooze.isPending}
            onClick={submit}
          >
            {snooze.isPending ? 'Snoozing…' : 'Snooze'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
