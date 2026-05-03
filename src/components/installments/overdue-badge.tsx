import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OverdueBadgeProps {
  /** ISO date string (YYYY-MM-DD), interpreted in Asia/Kolkata. */
  dueDate: string;
  testId?: string;
}

/**
 * Small "X days overdue" indicator used inside installment cards. The
 * computation is purely presentational — it does NOT decide *whether* the
 * installment is overdue (the backend already did that via the derived
 * status). It only tells the user how late.
 */
export function OverdueBadge({ dueDate, testId }: OverdueBadgeProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return null;
  const text = diffDays === 1 ? '1 day overdue' : `${diffDays} days overdue`;
  return (
    <Badge
      variant="outline"
      className="border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 gap-1"
      data-testid={testId}
    >
      <AlertTriangle className="w-3 h-3" />
      {text}
    </Badge>
  );
}
