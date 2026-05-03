import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  Bell,
  CheckCircle2,
  Clock,
  Lock,
  Pencil,
  Receipt,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { ActivityType } from '@/lib/activity-types';

interface Props {
  type: ActivityType;
  className?: string;
}

/**
 * Single source of truth for activity icons. Mapping is presentation-only
 * — the backend remains authoritative on the underlying event meaning.
 */
export function ActivityIcon({ type, className }: Props) {
  const cls = className ?? 'h-4 w-4';
  switch (type) {
    case 'TRANSACTION_CREATED':
      return <Receipt className={cls} />;
    case 'TRANSACTION_UPDATED':
      return <Pencil className={cls} />;
    case 'TRANSACTION_OMITTED':
      return <XCircle className={cls} />;
    case 'INSTALLMENT_CREATED':
      return <ArrowUpCircle className={cls} />;
    case 'INSTALLMENT_UPDATED':
      return <Pencil className={cls} />;
    case 'INSTALLMENT_CANCELLED':
      return <Ban className={cls} />;
    case 'INSTALLMENT_PAYMENT_RECORDED':
      return <ArrowDownCircle className={cls} />;
    case 'REMINDER_CREATED':
      return <Bell className={cls} />;
    case 'REMINDER_COMPLETED':
      return <CheckCircle2 className={cls} />;
    case 'REMINDER_SNOOZED':
      return <Clock className={cls} />;
    case 'REMINDER_ARCHIVED':
      return <Trash2 className={cls} />;
    case 'HIDDEN_PARTNER_CREATED':
    case 'HIDDEN_PARTNER_UPDATED':
    case 'HIDDEN_PARTNER_ARCHIVED':
    case 'HIDDEN_PARTNER_RESTORED':
      return <Lock className={cls} />;
    default:
      return <Receipt className={cls} />;
  }
}
