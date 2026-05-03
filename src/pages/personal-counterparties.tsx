import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';
import { AuthGuard } from '@/components/auth-guard';
import { Layout } from '@/components/layout';
import type { CounterpartySummary, PagedResponse } from '@/lib/types';
import { BalanceBadge, BalanceText } from '@/components/ledger/balance-line';
import { formatAmount } from '@/lib/ledger-format';

export default function PersonalCounterpartiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['personal-counterparties', search, page],
    queryFn: () => apiGet<PagedResponse<CounterpartySummary>>('/personal/counterparties', {
      search: search.trim() || undefined,
      page,
      limit,
    }),
  });

  const counterparties = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/personal')}
              data-testid="button-counterparties-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">People</h1>
              <p className="text-sm text-muted-foreground mt-1">Who owes you, who you owe</p>
            </div>
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-counterparties-search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by name..."
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : counterparties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No people yet</p>
              <p className="text-sm mt-1">
                {search.trim()
                  ? 'No one matches your search.'
                  : 'Add a personal transaction with a counterparty name to start tracking.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence>
                {counterparties.map((c, i) => (
                  <motion.div
                    key={c.counterpartyName}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      data-testid={`card-counterparty-${c.counterpartyName}`}
                      onClick={() => navigate(`/personal/counterparties/${encodeURIComponent(c.counterpartyName)}`)}
                    >
                      <CardContent className="py-4 px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className="font-semibold truncate"
                                data-testid={`text-cp-name-${c.counterpartyName}`}
                              >
                                {c.counterpartyName}
                              </p>
                              <BalanceBadge
                                direction={c.direction}
                                testId={`badge-cp-direction-${c.counterpartyName}`}
                              />
                            </div>
                            <BalanceText summary={c} className="text-sm mt-1.5" />
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span>
                                Given:{' '}
                                <span className="font-medium text-foreground">
                                  {formatAmount(c.totalGiven)}
                                </span>
                              </span>
                              <span>
                                Received:{' '}
                                <span className="font-medium text-foreground">
                                  {formatAmount(c.totalReceived)}
                                </span>
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-counterparties-prev"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-counterparties-next"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
}
