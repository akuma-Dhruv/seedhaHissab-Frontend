import { History, Ban, Pencil, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TRANSACTION_TYPE_LABELS,
  type Transaction,
} from '@/lib/types';
import {
  POSITIVE_LEDGER_TYPES,
  PERSONAL_LIST_INFLOW_TYPES,
  formatAmount,
  formatDate,
} from '@/lib/ledger-format';
import { TimelineEntry } from '@/components/timeline/timeline-entry';

export type RowMode = 'personal-list' | 'counterparty-ledger';

interface TransactionRowProps {
  tx: Transaction;
  /**
   * "personal-list" colours rows by user-cash-flow direction (income green).
   * "counterparty-ledger" colours by ledger sign (they-owe-me green).
   */
  mode: RowMode;
  index?: number;
  onHistory: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onOmit: (tx: Transaction) => void;
  testIdPrefix: string;
}

/**
 * A single transaction in any list view. Implemented as a thin specialisation
 * of TimelineEntry so reminders and other future activity items share the
 * same row geometry.
 */
export function TransactionRow({
  tx,
  mode,
  index = 0,
  onHistory,
  onEdit,
  onOmit,
  testIdPrefix,
}: TransactionRowProps) {
  const isPositive = mode === 'counterparty-ledger'
    ? POSITIVE_LEDGER_TYPES.has(tx.type)
    : PERSONAL_LIST_INFLOW_TYPES.has(tx.type);

  const ArrowIcon = mode === 'counterparty-ledger'
    ? (isPositive ? ArrowUpRight : ArrowDownRight)
    : (isPositive ? ArrowDownRight : ArrowUpRight);

  const showCounterpartyInline = mode === 'personal-list' && !!tx.counterpartyName;

  const iconNode = (
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
        isPositive
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      }`}
    >
      <ArrowIcon className="w-4 h-4" />
    </div>
  );

  const topRow = (
    <>
      <Badge variant="outline" className="text-xs">
        {TRANSACTION_TYPE_LABELS[tx.type]}
      </Badge>
      {showCounterpartyInline && (
        <span className="text-xs text-muted-foreground">
          {isPositive ? 'from' : 'to'}{' '}
          <span className="font-medium text-foreground">{tx.counterpartyName}</span>
        </span>
      )}
      {tx.status === 'OMITTED' && (
        <Badge variant="destructive" className="text-xs">Omitted</Badge>
      )}
      {mode === 'counterparty-ledger' && (
        <span className="text-xs text-muted-foreground">v{tx.version}</span>
      )}
    </>
  );

  const bottomRow = (
    <>
      <span
        className={`font-semibold ${tx.status === 'OMITTED' ? 'line-through' : ''} ${
          isPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {isPositive ? '+' : '−'} ₹{formatAmount(tx.amount)}
      </span>
      <span className="text-xs text-muted-foreground">{formatDate(tx.transactionDate)}</span>
      {tx.purpose && (
        <span className="text-xs text-muted-foreground truncate">{tx.purpose}</span>
      )}
    </>
  );

  const actions = (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        data-testid={`button-${testIdPrefix}-history-${tx.id}`}
        onClick={() => onHistory(tx)}
        title="View history"
      >
        <History className="w-3.5 h-3.5" />
      </Button>
      {tx.status === 'ACTIVE' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          data-testid={`button-${testIdPrefix}-edit-${tx.id}`}
          onClick={() => onEdit(tx)}
          title="Edit transaction"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      )}
      {tx.status === 'ACTIVE' && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          data-testid={`button-${testIdPrefix}-omit-${tx.id}`}
          onClick={() => onOmit(tx)}
          title="Omit transaction"
        >
          <Ban className="w-3.5 h-3.5" />
        </Button>
      )}
    </>
  );

  return (
    <TimelineEntry
      iconNode={iconNode}
      topRow={topRow}
      bottomRow={bottomRow}
      actions={actions}
      dimmed={tx.status === 'OMITTED'}
      index={index}
      testId={`row-${testIdPrefix}-${tx.id}`}
    />
  );
}
