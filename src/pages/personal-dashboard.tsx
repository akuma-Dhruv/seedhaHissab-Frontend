import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, Wallet, Users, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import { PersonalTransactionList } from '@/components/personal-transaction-list';
import type { PersonalSummaryResponse } from '@/lib/types';
import { motion } from 'framer-motion';

function formatAmount(val: number) {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'emerald' | 'rose' | 'sky' | 'amber' | 'neutral';
  testId: string;
}

const TONES: Record<StatCardProps['tone'], { text: string; icon: string }> = {
  emerald: { text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500/30' },
  rose:    { text: 'text-rose-600 dark:text-rose-400',       icon: 'text-rose-500/30' },
  sky:     { text: 'text-sky-600 dark:text-sky-400',         icon: 'text-sky-500/30' },
  amber:   { text: 'text-amber-600 dark:text-amber-400',     icon: 'text-amber-500/30' },
  neutral: { text: 'text-foreground',                         icon: 'text-primary/30' },
};

function StatCard({ label, value, icon, tone, testId }: StatCardProps) {
  const t = TONES[tone];
  return (
    <Card>
      <CardContent className="py-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-semibold mt-1 ${t.text}`} data-testid={testId}>
              {formatAmount(value)}
            </p>
          </div>
          <div className={`w-8 h-8 ${t.icon}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PersonalDashboardPage() {
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['personal-summary'],
    queryFn: () => apiGet<PersonalSummaryResponse>('/personal/summary'),
  });

  const netTone = summary && summary.netBalance < 0 ? 'rose' : 'emerald';

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-personal-title">Personal</h1>
              <p className="text-sm text-muted-foreground mt-1">Your person-to-person money in &amp; out</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                data-testid="button-view-counterparties"
                onClick={() => navigate('/personal/counterparties')}
              >
                <Users className="w-4 h-4 mr-2" />
                People
              </Button>
              <Button
                data-testid="button-add-personal-transaction"
                onClick={() => navigate('/personal/transactions/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>

          {summaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : summary && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <StatCard
                label="They owe you"
                value={summary.totalReceivable}
                icon={<ArrowUpCircle className="w-8 h-8" />}
                tone="emerald"
                testId="text-personal-receivable"
              />
              <StatCard
                label="You owe"
                value={summary.totalPayable}
                icon={<ArrowDownCircle className="w-8 h-8" />}
                tone="rose"
                testId="text-personal-payable"
              />
              <StatCard
                label="Net Balance"
                value={summary.netBalance}
                icon={<Wallet className="w-8 h-8" />}
                tone={netTone}
                testId="text-personal-net"
              />
              <StatCard
                label="Total Lent"
                value={summary.totalLent}
                icon={<TrendingUp className="w-8 h-8" />}
                tone="sky"
                testId="text-personal-lent"
              />
              <StatCard
                label="Total Borrowed"
                value={summary.totalBorrowed}
                icon={<TrendingDown className="w-8 h-8" />}
                tone="amber"
                testId="text-personal-borrowed"
              />
              <StatCard
                label="Income (cash-flow)"
                value={summary.totalIncome}
                icon={<TrendingUp className="w-8 h-8" />}
                tone="emerald"
                testId="text-personal-income"
              />
              <StatCard
                label="Expense (cash-flow)"
                value={summary.totalExpense}
                icon={<TrendingDown className="w-8 h-8" />}
                tone="rose"
                testId="text-personal-expense"
              />
            </motion.div>
          )}

          <PersonalTransactionList />
        </div>
      </Layout>
    </AuthGuard>
  );
}
