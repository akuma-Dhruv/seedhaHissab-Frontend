import type { Reminder, Transaction } from './types';

/**
 * A normalised, render-friendly shape that any "thing the user did or needs to
 * do" on the personal/business ledger can collapse into. Today only
 * transactions and reminders implement this; tomorrow we may add things like
 * vendor due cycles or auto-generated installment items.
 *
 * Crucially, this is **only a presentation contract**. It is NOT a storage
 * format and never passes between services. Each adapter (`transactionToActivity`,
 * `reminderToActivity`) lives next to its source-of-truth type.
 *
 * Consumers of `ActivityItem` should treat `raw` as opaque — but kind-specific
 * components (TransactionRow, ReminderCard) narrow on `kind` and read it.
 */
export type ActivityKind = 'TRANSACTION' | 'REMINDER';

export interface ActivityBase {
  /** Stable identifier — the underlying entity's id. */
  id: string;
  kind: ActivityKind;
  /** ISO date (YYYY-MM-DD). Drives chronological ordering. */
  date: string;
  /** Primary line, plain text. */
  title: string;
  /** Optional secondary line, plain text. */
  subtitle?: string;
  /** True when the entry should render visually muted (omitted / completed / archived). */
  dimmed: boolean;
  /** Common entity references — purely informational, never authoritative. */
  links: {
    counterpartyName?: string;
    projectId?: string;
    rootTransactionId?: string;
  };
}

export interface ActivityTransaction extends ActivityBase {
  kind: 'TRANSACTION';
  raw: Transaction;
}

export interface ActivityReminder extends ActivityBase {
  kind: 'REMINDER';
  raw: Reminder;
}

export type ActivityItem = ActivityTransaction | ActivityReminder;

/**
 * Adapter from a personal/project Transaction to a presentation activity
 * item. The amount + sign continue to live in `raw` — kind-specific
 * renderers project them into the UI.
 */
export function transactionToActivity(t: Transaction, subtitle?: string): ActivityTransaction {
  return {
    id: t.id,
    kind: 'TRANSACTION',
    date: t.transactionDate,
    title: subtitle ?? t.purpose ?? '',
    subtitle: undefined,
    dimmed: t.status === 'OMITTED',
    links: {
      counterpartyName: t.counterpartyName,
      projectId: t.projectId,
      rootTransactionId: t.rootTransactionId,
    },
    raw: t,
  };
}

/**
 * Adapter from a Reminder to a presentation activity item. `dimmed` covers
 * COMPLETED + ARCHIVED so consumers don't repeat that rule.
 */
export function reminderToActivity(r: Reminder): ActivityReminder {
  return {
    id: r.id,
    kind: 'REMINDER',
    date: r.dueDate,
    title: r.title,
    subtitle: r.description,
    dimmed: r.status === 'COMPLETED' || r.status === 'ARCHIVED',
    links: {
      counterpartyName: r.linkedCounterpartyName,
      projectId: r.linkedProjectId,
      rootTransactionId: r.linkedTransactionId,
    },
    raw: r,
  };
}
