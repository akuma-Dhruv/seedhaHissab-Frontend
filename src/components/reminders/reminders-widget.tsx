import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bell } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReminderCard } from './reminder-card';
import { ReminderForm } from './reminder-form';
import { SnoozeDialog } from './snooze-dialog';
import {
  useCompleteReminder,
  useReminders,
} from '@/hooks/use-reminders';
import type { Reminder } from '@/lib/types';

interface RemindersWidgetProps {
  /** Filter scope. Exactly one of these is typically passed by the consumer. */
  counterpartyName?: string;
  projectId?: string;
  /**
   * Hides the chip that would otherwise echo the scope back at the user
   * (e.g. on the counterparty page itself). Defaults to true when the
   * matching filter is set.
   */
  hideCounterpartyChip?: boolean;
  hideProjectChip?: boolean;
  /** Heading shown above the list. */
  title?: string;
  /** Maximum number of items to show before linking out. */
  maxItems?: number;
  testIdPrefix?: string;
}

/**
 * Compact list of reminders scoped to a counterparty or project, with
 * inline complete/snooze/archive actions and a quick-add button. Consumers
 * embed this on the counterparty ledger and project dashboard.
 */
export function RemindersWidget({
  counterpartyName,
  projectId,
  hideCounterpartyChip = !!counterpartyName,
  hideProjectChip = !!projectId,
  title = 'Reminders',
  maxItems = 5,
  testIdPrefix = 'widget-rem',
}: RemindersWidgetProps) {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<Reminder | null>(null);

  const { data, isLoading } = useReminders({
    linkedCounterpartyName: counterpartyName,
    linkedProjectId: projectId,
    limit: maxItems,
  });

  const completeMutation = useCompleteReminder();

  const reminders = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <Card>
      <CardContent className="py-4 px-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight" data-testid={`text-${testIdPrefix}-title`}>
              {title}
            </h2>
            {total > 0 && (
              <span className="text-xs text-muted-foreground" data-testid={`text-${testIdPrefix}-count`}>
                {total}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            data-testid={`button-${testIdPrefix}-add`}
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : reminders.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No reminders yet. Add one to track follow-ups.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence>
                {reminders.map((r, i) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    index={i}
                    onComplete={(rem) => completeMutation.mutate(rem.id)}
                    onSnooze={setSnoozeTarget}
                    hideCounterpartyChip={hideCounterpartyChip}
                    hideProjectChip={hideProjectChip}
                    testIdPrefix={testIdPrefix}
                  />
                ))}
              </AnimatePresence>
            </div>
            {total > reminders.length && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                data-testid={`button-${testIdPrefix}-view-all`}
                onClick={() => navigate('/reminders')}
              >
                View all reminders ({total})
              </Button>
            )}
          </>
        )}

        <ReminderForm
          open={formOpen}
          onOpenChange={setFormOpen}
          lockCounterpartyName={counterpartyName}
          lockProjectId={projectId}
        />
        <SnoozeDialog reminder={snoozeTarget} onClose={() => setSnoozeTarget(null)} />
      </CardContent>
    </Card>
  );
}
