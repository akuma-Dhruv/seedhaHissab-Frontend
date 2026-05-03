/**
 * Mirrors backend `ActivityType` and `FinancialVisibilityScope` enums.
 *
 * The frontend never builds activity narration strings — those come fully
 * formed from the server. The FE's job is to choose icons, layout, and
 * filtering. Anything source-specific lives on `extraData` (intentionally
 * a free-form record, see backend `ActivityItemDTO` javadoc).
 */
export type ActivityType =
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_UPDATED'
  | 'TRANSACTION_OMITTED'
  | 'REMINDER_CREATED'
  | 'REMINDER_COMPLETED'
  | 'REMINDER_SNOOZED'
  | 'REMINDER_ARCHIVED'
  | 'INSTALLMENT_CREATED'
  | 'INSTALLMENT_UPDATED'
  | 'INSTALLMENT_CANCELLED'
  | 'INSTALLMENT_PAYMENT_RECORDED'
  | 'HIDDEN_PARTNER_CREATED'
  | 'HIDDEN_PARTNER_UPDATED'
  | 'HIDDEN_PARTNER_ARCHIVED'
  | 'HIDDEN_PARTNER_RESTORED'
  | 'SYSTEM_EVENT';

export type ActivityVisibilityScope = 'OFFICIAL' | 'PRIVATE';

export interface ActivityItem {
  activityKey: string;
  type: ActivityType;
  timestamp: string;
  actorUserId: string | null;
  actorName: string | null;
  title: string;
  subtitle: string | null;
  amount: number | null;
  visibilityScope: ActivityVisibilityScope;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  badge: string | null;
  status: string | null;
  extraData: Record<string, unknown>;
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
  page: number;
  limit: number;
  hasMore: boolean;
}

/** Presentation grouping used by FE filter chips. */
export const ACTIVITY_TYPE_GROUPS: Record<string, ActivityType[]> = {
  Transactions: ['TRANSACTION_CREATED', 'TRANSACTION_UPDATED', 'TRANSACTION_OMITTED'],
  Installments: [
    'INSTALLMENT_CREATED',
    'INSTALLMENT_UPDATED',
    'INSTALLMENT_CANCELLED',
    'INSTALLMENT_PAYMENT_RECORDED',
  ],
  Reminders: ['REMINDER_CREATED', 'REMINDER_COMPLETED', 'REMINDER_SNOOZED', 'REMINDER_ARCHIVED'],
  'Private partners': [
    'HIDDEN_PARTNER_CREATED',
    'HIDDEN_PARTNER_UPDATED',
    'HIDDEN_PARTNER_ARCHIVED',
  ],
};
