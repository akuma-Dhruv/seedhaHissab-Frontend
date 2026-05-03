import { useState } from 'react';
import { Plus, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import { ReminderCard } from '@/components/reminders/reminder-card';
import { ReminderForm } from '@/components/reminders/reminder-form';
import { SnoozeDialog } from '@/components/reminders/snooze-dialog';
import { DateGroupHeader } from '@/components/timeline/date-group-header';
import {
  useArchiveReminder,
  useCompleteReminder,
  useOverdueReminders,
  useReminders,
  useTodayReminders,
  useUpcomingReminders,
} from '@/hooks/use-reminders';
import type { Reminder } from '@/lib/types';

interface SectionProps {
  label: string;
  hint?: string;
  reminders: Reminder[];
  isLoading?: boolean;
  emptyText: string;
  onComplete: (r: Reminder) => void;
  onSnooze: (r: Reminder) => void;
  onArchive: (r: Reminder) => void;
  testIdPrefix: string;
}

function Section({ label, hint, reminders, isLoading, emptyText,
                   onComplete, onSnooze, onArchive, testIdPrefix }: SectionProps) {
  return (
    <div className="space-y-2">
      <DateGroupHeader label={label} hint={hint} />
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : reminders.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1 py-2">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {reminders.map((r, i) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                index={i}
                onComplete={onComplete}
                onSnooze={onSnooze}
                onArchive={onArchive}
                testIdPrefix={testIdPrefix}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function RemindersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<Reminder | null>(null);

  const [completedPage, setCompletedPage] = useState(0);
  const [search, setSearch] = useState('');

  const today = useTodayReminders();
  const overdue = useOverdueReminders();
  const upcoming = useUpcomingReminders();

  const completed = useReminders({
    status: 'COMPLETED',
    page: completedPage,
    limit: 10,
  });

  const completeMutation = useCompleteReminder();
  const archiveMutation = useArchiveReminder();

  const handleComplete = (r: Reminder) => completeMutation.mutate(r.id);
  const handleArchive = (r: Reminder) => archiveMutation.mutate(r.id);

  const matches = (r: Reminder) =>
    !search.trim()
      || r.title.toLowerCase().includes(search.trim().toLowerCase())
      || (r.description ?? '').toLowerCase().includes(search.trim().toLowerCase())
      || (r.linkedCounterpartyName ?? '').toLowerCase().includes(search.trim().toLowerCase());

  const todayList = (today.data ?? []).filter(matches);
  const overdueList = (overdue.data ?? []).filter(matches);
  const upcomingList = (upcoming.data ?? []).filter(matches);
  const completedList = (completed.data?.data ?? []).filter(matches);

  const completedTotalPages = completed.data
    ? Math.max(1, Math.ceil(completed.data.total / completed.data.limit))
    : 1;

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-reminders-title">
                  Reminders
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Follow-ups, dues, and to-dos. Notes only — no money moves here.
                </p>
              </div>
            </div>
            <Button
              data-testid="button-reminders-new"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New reminder
            </Button>
          </div>

          <Card>
            <CardContent className="py-3 px-4">
              <Input
                data-testid="input-reminders-search"
                placeholder="Search by title, note, or counterparty…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CardContent>
          </Card>

          <Section
            label="Overdue"
            hint={overdueList.length ? `${overdueList.length}` : undefined}
            reminders={overdueList}
            isLoading={overdue.isLoading}
            emptyText="Nothing overdue. Nice."
            onComplete={handleComplete}
            onSnooze={setSnoozeTarget}
            onArchive={handleArchive}
            testIdPrefix="rem-overdue"
          />

          <Section
            label="Today"
            hint={todayList.length ? `${todayList.length}` : undefined}
            reminders={todayList}
            isLoading={today.isLoading}
            emptyText="No reminders due today."
            onComplete={handleComplete}
            onSnooze={setSnoozeTarget}
            onArchive={handleArchive}
            testIdPrefix="rem-today"
          />

          <Section
            label="Upcoming · next 7 days"
            hint={upcomingList.length ? `${upcomingList.length}` : undefined}
            reminders={upcomingList}
            isLoading={upcoming.isLoading}
            emptyText="Nothing scheduled this week."
            onComplete={handleComplete}
            onSnooze={setSnoozeTarget}
            onArchive={handleArchive}
            testIdPrefix="rem-upcoming"
          />

          <Section
            label="Completed"
            hint={completed.data?.total ? `${completed.data.total}` : undefined}
            reminders={completedList}
            isLoading={completed.isLoading}
            emptyText="No completed reminders yet."
            onComplete={handleComplete}
            onSnooze={setSnoozeTarget}
            onArchive={handleArchive}
            testIdPrefix="rem-completed"
          />

          {completed.data && completed.data.total > completed.data.limit && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-completed-prev"
                disabled={completedPage === 0}
                onClick={() => setCompletedPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {completedPage + 1} of {completedTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-completed-next"
                disabled={completedPage >= completedTotalPages - 1}
                onClick={() => setCompletedPage(p => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          <ReminderForm open={formOpen} onOpenChange={setFormOpen} />
          <SnoozeDialog reminder={snoozeTarget} onClose={() => setSnoozeTarget(null)} />
        </div>
      </Layout>
    </AuthGuard>
  );
}

