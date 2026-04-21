import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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

export default function PersonalDashboardPage() {
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['personal-summary'],
    queryFn: () => apiGet<PersonalSummaryResponse>('/personal/summary'),
  });

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-personal-title">Personal</h1>
              <p className="text-sm text-muted-foreground mt-1">Your person-to-person income and expenses</p>
            </div>
            <Button
              data-testid="button-add-personal-transaction"
              onClick={() => navigate('/personal/transactions/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : summary && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Income</p>
                      <p className="text-xl font-semibold mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-personal-income">
                        {formatAmount(summary.totalIncome)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-500/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Expense</p>
                      <p className="text-xl font-semibold mt-1 text-rose-600 dark:text-rose-400" data-testid="text-personal-expense">
                        {formatAmount(summary.totalExpense)}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-rose-500/30" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Net Balance</p>
                      <p
                        className={`text-xl font-semibold mt-1 ${Number(summary.netBalance) >= 0 ? 'text-primary' : 'text-rose-600 dark:text-rose-400'}`}
                        data-testid="text-personal-net"
                      >
                        {formatAmount(summary.netBalance)}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <PersonalTransactionList />
        </div>
      </Layout>
    </AuthGuard>
  );
}
