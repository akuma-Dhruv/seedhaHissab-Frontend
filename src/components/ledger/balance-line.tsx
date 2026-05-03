import { Badge } from '@/components/ui/badge';
import type { CounterpartyDirection, CounterpartySummary } from '@/lib/types';
import { formatAmount } from '@/lib/ledger-format';

type Tone = 'emerald' | 'rose' | 'muted';

export function toneFromDirection(direction: CounterpartyDirection): Tone {
  if (direction === 'THEY_OWE_ME') return 'emerald';
  if (direction === 'I_OWE_THEM') return 'rose';
  return 'muted';
}

export function summaryLine(c: CounterpartySummary): { text: string; tone: Tone } {
  if (c.direction === 'THEY_OWE_ME') {
    return { text: `${c.counterpartyName} owes you ₹${formatAmount(c.netBalance)}`, tone: 'emerald' };
  }
  if (c.direction === 'I_OWE_THEM') {
    return { text: `You owe ${c.counterpartyName} ₹${formatAmount(Math.abs(c.netBalance))}`, tone: 'rose' };
  }
  return { text: `All settled with ${c.counterpartyName}`, tone: 'muted' };
}

const TONE_TEXT: Record<Tone, string> = {
  emerald: 'text-emerald-700 dark:text-emerald-400',
  rose:    'text-rose-700 dark:text-rose-400',
  muted:   'text-muted-foreground',
};

const TONE_BADGE: Record<Tone, string> = {
  emerald: 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400',
  rose:    'border-rose-500/50 text-rose-700 dark:text-rose-400',
  muted:   '',
};

export interface BalanceBadgeProps {
  direction: CounterpartyDirection;
  testId?: string;
}

/** Small inline pill — used in the counterparty list cards. */
export function BalanceBadge({ direction, testId }: BalanceBadgeProps) {
  const tone = toneFromDirection(direction);
  const label =
    direction === 'THEY_OWE_ME' ? 'They owe you'
    : direction === 'I_OWE_THEM' ? 'You owe'
    : 'Settled';
  return (
    <Badge
      variant={direction === 'SETTLED' ? 'secondary' : 'outline'}
      className={`text-xs ${TONE_BADGE[tone]}`}
      data-testid={testId}
    >
      {label}
    </Badge>
  );
}

export interface BalanceTextProps {
  summary: CounterpartySummary;
  className?: string;
}

/** One-liner like "Rahul owes you ₹5,000" — used in cards. */
export function BalanceText({ summary, className }: BalanceTextProps) {
  const line = summaryLine(summary);
  return (
    <p className={`${TONE_TEXT[line.tone]} ${className ?? ''}`}>
      {line.text}
    </p>
  );
}

export interface BalanceHeaderProps {
  summary: CounterpartySummary;
  testIds?: { net?: string; given?: string; received?: string };
}

/**
 * Big card-style header used at the top of the counterparty ledger page.
 * Shows directional headline + net amount + given / received breakdown.
 */
export function BalanceHeader({ summary, testIds }: BalanceHeaderProps) {
  const tone = toneFromDirection(summary.direction);
  const headline =
    summary.direction === 'THEY_OWE_ME'  ? `${summary.counterpartyName} owes you`
  : summary.direction === 'I_OWE_THEM'   ? `You owe ${summary.counterpartyName}`
  :                                        `Settled with ${summary.counterpartyName}`;
  const amount =
    summary.direction === 'I_OWE_THEM' ? Math.abs(summary.netBalance) : summary.netBalance;

  const big = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose:    'text-rose-600 dark:text-rose-400',
    muted:   'text-muted-foreground',
  }[tone];

  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {headline}
      </p>
      <p className={`text-3xl font-semibold mt-1 ${big}`} data-testid={testIds?.net}>
        ₹{formatAmount(amount)}
      </p>
      <div className="flex gap-6 mt-3 text-sm text-muted-foreground">
        <span>
          You gave:{' '}
          <span className="font-medium text-foreground" data-testid={testIds?.given}>
            ₹{formatAmount(summary.totalGiven)}
          </span>
        </span>
        <span>
          You received:{' '}
          <span className="font-medium text-foreground" data-testid={testIds?.received}>
            ₹{formatAmount(summary.totalReceived)}
          </span>
        </span>
      </div>
    </div>
  );
}
